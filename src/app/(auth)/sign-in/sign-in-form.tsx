"use client"

import { useActionState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { credentialsSignInAction } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function SignInForm() {
  const [state, action, pending] = useActionState(credentialsSignInAction, null)
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get("registered") === "1") {
      toast.success("Account created! You can now sign in.", { id: "registered" })
    }
  }, [])

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
      <Input
        name="password"
        type="password"
        placeholder="Password"
        autoComplete="current-password"
        required
      />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  )
}
