"use server"

import { redirect } from "next/navigation"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export async function resetPasswordAction(
  _prev: { error: string } | null,
  formData: FormData
) {
  const token = formData.get("token") as string
  const password = formData.get("password") as string
  const confirmPassword = formData.get("confirmPassword") as string

  if (!password || !confirmPassword) {
    return { error: "All fields are required." }
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." }
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." }
  }

  const record = await prisma.verificationToken.findUnique({ where: { token } })

  if (!record) {
    return { error: "Invalid or expired reset link. Please request a new one." }
  }

  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token } })
    return { error: "This reset link has expired. Please request a new one." }
  }

  const user = await prisma.user.findUnique({ where: { email: record.identifier } })

  if (!user) {
    return { error: "Invalid reset link." }
  }

  const hashed = await bcrypt.hash(password, 12)

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { password: hashed } }),
    prisma.verificationToken.delete({ where: { token } }),
  ])

  redirect("/sign-in?reset=1")
}
