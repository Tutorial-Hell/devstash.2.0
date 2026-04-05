import NextAuth from "next-auth"
import authConfig from "./auth.config"

const { auth } = NextAuth(authConfig)

export const middleware = auth((req) => {
  if (!req.auth) {
    const signInUrl = new URL("/sign-in", req.nextUrl.origin)
    return Response.redirect(signInUrl)
  }
})

export const config = {
  matcher: ["/dashboard/:path*", "/profile"],
}
