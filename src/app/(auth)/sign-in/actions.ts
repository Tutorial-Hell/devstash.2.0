"use server"

import { signIn } from "@/auth"
import { AuthError } from "next-auth"
import { prisma } from "@/lib/prisma"
import { EMAIL_VERIFICATION_ENABLED } from "@/lib/flags"
import { rateLimit, getClientIp, rateLimitErrorMessage } from "@/lib/rate-limit"

export async function credentialsSignInAction(
  _prev: { error: string } | null,
  formData: FormData
) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  const ip = await getClientIp()
  const rl = await rateLimit("login", `${ip}:${email}`)
  if (!rl.success) {
    return { error: rateLimitErrorMessage(rl.retryAfterMinutes!) }
  }

  // Check email verification before attempting sign-in so we can show a clear error
  if (EMAIL_VERIFICATION_ENABLED) {
    const user = await prisma.user.findUnique({ where: { email }, select: { emailVerified: true, password: true } })
    if (user?.password && !user.emailVerified) {
      return { error: "Please verify your email before signing in. Check your inbox." }
    }
  }

  try {
    await signIn("credentials", { email, password, redirectTo: "/dashboard" })
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password." }
    }
    throw error
  }
  return null
}
