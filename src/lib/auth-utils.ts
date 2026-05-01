import { auth } from "@/auth"
import type { Session } from "next-auth"

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

export async function requireProUser(
  proErrorMessage = "This feature requires a Pro subscription."
): Promise<RequireProResult> {
  const session = await auth()
  const userId = session?.user?.id ?? null
  if (!userId) return { ok: false, error: "Not authenticated." }
  if (!session?.user?.isPro) return { ok: false, error: proErrorMessage }
  return { ok: true, userId, session }
}
