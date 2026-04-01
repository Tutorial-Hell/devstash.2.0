"use server"

import { signIn } from "@/auth"
import { AuthError } from "next-auth"

export async function credentialsSignInAction(
  _prev: { error: string } | null,
  formData: FormData
) {
  try {
    await signIn("credentials", {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      redirectTo: "/dashboard",
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password." }
    }
    throw error
  }
  return null
}
