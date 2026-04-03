"use server"

import { randomBytes } from "crypto"
import { prisma } from "@/lib/prisma"
import { sendPasswordResetEmail } from "@/lib/email"

export async function forgotPasswordAction(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  const raw = formData.get("email")
  if (!raw || typeof raw !== "string") {
    return { error: "Email is required." }
  }
  const email = raw.trim().toLowerCase()

  if (!email) {
    return { error: "Email is required." }
  }

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, password: true } })

  // Always show success to prevent user enumeration
  if (!user || !user.password) {
    return { success: true }
  }

  // Delete any existing reset token for this email
  await prisma.verificationToken.deleteMany({ where: { identifier: email } })

  const token = randomBytes(32).toString("hex")
  const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

  await prisma.verificationToken.create({
    data: { identifier: email, token, expires },
  })

  sendPasswordResetEmail(email, token).catch((err) =>
    console.error("Failed to send password reset email:", err)
  )

  return { success: true }
}
