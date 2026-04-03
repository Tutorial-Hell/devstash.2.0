import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { createVerificationToken } from "@/lib/verification-token"
import { sendVerificationEmail } from "@/lib/email"

export async function POST(request: NextRequest) {
  let name: string, email: string, password: string, confirmPassword: string
  try {
    ;({ name, email, password, confirmPassword } = await request.json())
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  if (!name || !email || !password || !confirmPassword) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 })
  }

  if (password !== confirmPassword) {
    return NextResponse.json({ error: "Passwords do not match" }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 })
  }

  const hashed = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: { name, email, password: hashed },
  })

  const token = await createVerificationToken(user.id)
  await sendVerificationEmail(email, token)

  return NextResponse.json({ success: true }, { status: 201 })
}
