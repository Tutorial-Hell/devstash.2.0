import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")

  if (!token) {
    return NextResponse.redirect(new URL("/sign-in?error=missing_token", request.nextUrl.origin))
  }

  const record = await prisma.emailVerificationToken.findUnique({ where: { token } })

  if (!record) {
    return NextResponse.redirect(new URL("/sign-in?error=invalid_token", request.nextUrl.origin))
  }

  if (record.expires < new Date()) {
    await prisma.emailVerificationToken.delete({ where: { token } })
    return NextResponse.redirect(new URL("/sign-in?error=expired_token", request.nextUrl.origin))
  }

  await prisma.user.update({
    where: { id: record.userId },
    data: { emailVerified: new Date() },
  })

  await prisma.emailVerificationToken.delete({ where: { token } })

  return NextResponse.redirect(new URL("/sign-in?verified=1", request.nextUrl.origin))
}
