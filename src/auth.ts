import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import GitHub from "next-auth/providers/github"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import authConfig from "./auth.config"
import { EMAIL_VERIFICATION_ENABLED } from "@/lib/flags"

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  ...authConfig,
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "github" && user.email) {
        const existing = await prisma.user.findUnique({
          where: { email: user.email },
          select: { accounts: { where: { provider: "github" }, select: { id: true } } },
        })
        // User exists with this email but no linked GitHub account — would throw OAuthAccountNotLinked
        if (existing && existing.accounts.length === 0) {
          return "/sign-in?error=OAuthAccountNotLinked"
        }
      }
      return true
    },
    async jwt({ token, user }) {
      if (user?.id) token.sub = user.id
      if (token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { isPro: true },
        })
        token.isPro = dbUser?.isPro ?? false
      }
      return token
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub
      if (typeof token.isPro === "boolean") session.user.isPro = token.isPro
      return session
    },
  },
  providers: [
    GitHub,
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const { email, password } = credentials as { email: string; password: string }
        if (!email || !password) return null

        const user = await prisma.user.findUnique({ where: { email } })
        if (!user?.password) return null

        const isValid = await bcrypt.compare(password, user.password)
        if (!isValid) return null

        if (EMAIL_VERIFICATION_ENABLED && !user.emailVerified) return null

        return user
      },
    }),
  ],
})
