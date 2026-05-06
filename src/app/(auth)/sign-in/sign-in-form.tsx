"use client"

import { useActionState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
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
    if (searchParams.get("verified") === "1") {
      toast.success("Email verified! You can now sign in.", { id: "verified" })
    }
    if (searchParams.get("error") === "OAuthAccountNotLinked") {
      toast.error("An account with this email already exists. Sign in with your password instead.", { id: "OAuthAccountNotLinked" })
    }
    if (searchParams.get("error") === "expired_token") {
      toast.error("Verification link expired. Please register again.", { id: "expired_token" })
    }
    if (searchParams.get("error") === "invalid_token") {
      toast.error("Invalid verification link.", { id: "invalid_token" })
    }
    if (searchParams.get("reset") === "1") {
      toast.success("Password reset! You can now sign in.", { id: "reset" })
    }
  }, [searchParams])

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
      <div className="space-y-1">
        <Input
          name="password"
          type="password"
          placeholder="Password"
          autoComplete="current-password"
          required
        />
        <div className="text-right">
          <Link href="/forgot-password" className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground">
            Forgot password?
          </Link>
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  )
}
