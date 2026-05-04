import { auth } from "@/auth"
import type { Session } from "next-auth"
import { NextResponse } from "next/server"
import { redirect } from "next/navigation"

export async function getAuthenticatedUserId(): Promise<string | null> {
  const session = await auth()
  return session?.user?.id ?? null
}

export async function getSession(): Promise<Session | null> {
  return auth()
}

type RequireProResult =
  | { ok: true; userId: string; session: Session }
  | { ok: false; error: string }

type RequireAuthResult =
  | { ok: true; userId: string }
  | { ok: false; response: NextResponse }

export async function requireAuth(): Promise<RequireAuthResult> {
  const userId = await getAuthenticatedUserId()
  if (!userId) return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  return { ok: true, userId }
}

export async function requireUserId(redirectTo = "/sign-in"): Promise<string> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) redirect(redirectTo)
  return userId
}

export async function requireProUser(
  proErrorMessage = "This feature requires a Pro subscription."
): Promise<RequireProResult> {
  const session = await auth()
  const userId = session?.user?.id ?? null
  if (!userId) return { ok: false, error: "Not authenticated." }
  if (!session?.user?.isPro) return { ok: false, error: proErrorMessage }
  return { ok: true, userId, session }
}
