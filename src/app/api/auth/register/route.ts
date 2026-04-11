import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { createVerificationToken } from "@/lib/verification-token"
import { sendVerificationEmail } from "@/lib/email"
import { EMAIL_VERIFICATION_ENABLED } from "@/lib/flags"
import { rateLimit, getClientIp, rateLimitErrorMessage } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  const ip = await getClientIp(request)
  const rl = await rateLimit("register", ip)
  if (!rl.success) {
    return NextResponse.json(
      { error: rateLimitErrorMessage(rl.retryAfterMinutes!) },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfterMinutes! * 60) },
      }
    )
  }

  let name: string, email: string, password: string, confirmPassword: string
  try {
    ;({ name, email, password, confirmPassword } = await request.json())
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  if (!name || !email || !password || !confirmPassword) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 })
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
  }

  if (password !== confirmPassword) {
    return NextResponse.json({ error: "Passwords do not match" }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 })
  }

  const hashed = await bcrypt.hash(password, 12)

  if (!EMAIL_VERIFICATION_ENABLED) {
    await prisma.user.create({ data: { name, email, password: hashed, emailVerified: new Date() } })
  } else {
    const user = await prisma.user.create({ data: { name, email, password: hashed } })
    const token = await createVerificationToken(user.id)
    sendVerificationEmail(email, token).catch((err) =>
      console.error("Failed to send verification email:", err)
    )
  }

  return NextResponse.json({ success: true }, { status: 201 })
}
