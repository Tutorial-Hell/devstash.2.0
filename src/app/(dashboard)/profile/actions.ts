"use server"

import { redirect } from "next/navigation"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { auth, signOut } from "@/auth"

export async function changePasswordAction(
  _prev: { error?: string; success?: string } | null,
  formData: FormData
) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Not authenticated." }

  const currentPassword = formData.get("currentPassword") as string
  const newPassword = formData.get("newPassword") as string
  const confirmPassword = formData.get("confirmPassword") as string

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: "All fields are required." }
  }

  if (newPassword !== confirmPassword) {
    return { error: "New passwords do not match." }
  }

  if (newPassword.length < 8) {
    return { error: "New password must be at least 8 characters." }
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { password: true },
  })

  if (!user?.password) {
    return { error: "No password set on this account." }
  }

  const isValid = await bcrypt.compare(currentPassword, user.password)
  if (!isValid) {
    return { error: "Current password is incorrect." }
  }

  const hashed = await bcrypt.hash(newPassword, 12)
  await prisma.user.update({ where: { id: session.user.id }, data: { password: hashed } })

  return { success: "Password updated successfully." }
}

export async function deleteAccountAction() {
  const session = await auth()
  if (!session?.user?.id) return

  await prisma.user.delete({ where: { id: session.user.id } })
  await signOut({ redirectTo: "/sign-in" })
  redirect("/sign-in")
}
