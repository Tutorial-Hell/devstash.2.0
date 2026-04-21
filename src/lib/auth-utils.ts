import { auth } from "@/auth"
import type { Session } from "next-auth"

export async function getAuthenticatedUserId(): Promise<string | null> {
  const session = await auth()
  return session?.user?.id ?? null
}

export async function getSession(): Promise<Session | null> {
  return auth()
}
