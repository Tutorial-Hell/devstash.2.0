import { signInWithGitHub } from "../actions"
import { RegisterForm } from "./register-form"
import { AuthPageShell } from "@/components/auth/auth-page-shell"

export default function RegisterPage() {
  return (
    <AuthPageShell
      title="Create an account"
      subtitle="Start building your developer stash"
      githubAction={signInWithGitHub}
      githubLabel="Sign up with GitHub"
      footerText="Already have an account?"
      footerLink={{ href: "/sign-in", label: "Sign in" }}
    >
      <RegisterForm />
    </AuthPageShell>
  )
}
