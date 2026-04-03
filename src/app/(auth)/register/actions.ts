"use server"

import { redirect } from "next/navigation"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { createVerificationToken } from "@/lib/verification-token"
import { sendVerificationEmail } from "@/lib/email"

export async function registerAction(
  _prev: { error: string } | null,
  formData: FormData
) {
  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const confirmPassword = formData.get("confirmPassword") as string

  if (!name || !email || !password || !confirmPassword) {
    return { error: "All fields are required." }
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." }
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return { error: "Email already registered." }
    }

    const hashed = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({ data: { name, email, password: hashed } })

    const token = await createVerificationToken(user.id)
    await sendVerificationEmail(email, token)
  } catch {
    return { error: "Registration failed. Please try again." }
  }

  redirect("/verify-email")
}
