"use client"

import { useActionState } from "react"
import { forgotPasswordAction } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(forgotPasswordAction, null)

  if (state?.success) {
    return (
      <p className="text-sm text-center text-muted-foreground">
        If an account exists for that email, you&apos;ll receive a password reset link shortly. Check your inbox.
      </p>
    )
  }

  return (
    <form action={action} className="space-y-3">
      {state?.error && (
        <p className="text-sm text-destructive text-center">{state.error}</p>
      )}
      <Input
        name="email"
        type="email"
        placeholder="Email"
        autoComplete="email"
        required
      />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  )
}
