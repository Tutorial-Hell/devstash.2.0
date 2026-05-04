import { Suspense } from "react"
import { signInWithGitHub } from "../actions"
import { SignInForm } from "./sign-in-form"
import { AuthPageShell } from "@/components/auth/auth-page-shell"

export default function SignInPage() {
  return (
    <AuthPageShell
      title="Welcome back"
      subtitle="Sign in to your DevStash account"
      githubAction={signInWithGitHub}
      githubLabel="Sign in with GitHub"
      footerText="Don't have an account?"
      footerLink={{ href: "/register", label: "Register" }}
    >
      <Suspense>
        <SignInForm />
      </Suspense>
    </AuthPageShell>
  )
}
