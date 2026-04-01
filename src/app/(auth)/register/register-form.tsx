"use client"

import { useActionState } from "react"
import { registerAction } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, null)

  return (
    <form action={action} className="space-y-3">
      {state?.error && (
        <p className="text-sm text-destructive text-center">{state.error}</p>
      )}
      <Input
        name="name"
        type="text"
        placeholder="Name"
        autoComplete="name"
        required
      />
      <Input
        name="email"
        type="email"
        placeholder="Email"
        autoComplete="email"
        required
      />
      <Input
        name="password"
        type="password"
        placeholder="Password"
        autoComplete="new-password"
        required
      />
      <Input
        name="confirmPassword"
        type="password"
        placeholder="Confirm password"
        autoComplete="new-password"
        required
      />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  )
}
