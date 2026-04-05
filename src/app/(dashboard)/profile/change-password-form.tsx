"use client"

import { useActionState } from "react"
import { changePasswordAction } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, null)

  return (
    <form action={action} className="space-y-3 max-w-sm">
      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-sm text-green-500">{state.success}</p>
      )}
      <Input
        name="currentPassword"
        type="password"
        placeholder="Current password"
        autoComplete="current-password"
        required
      />
      <Input
        name="newPassword"
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
      <Button type="submit" disabled={pending}>
        {pending ? "Updating…" : "Update password"}
      </Button>
    </form>
  )
}
