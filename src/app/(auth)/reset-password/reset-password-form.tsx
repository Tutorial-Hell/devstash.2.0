"use client"

import { useActionState } from "react"
import { resetPasswordAction } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPasswordAction, null)

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="token" value={token} />
      {state?.error && (
        <p className="text-sm text-destructive text-center">{state.error}</p>
      )}
      <Input
        name="password"
        type="password"
        placeholder="New password"
        autoComplete="new-password"
        required
      />
      <Input
        name="confirmPassword"
        type="password"
        placeholder="Confirm new password"
        autoComplete="new-password"
        required
      />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Resetting…" : "Reset password"}
      </Button>
    </form>
  )
}
