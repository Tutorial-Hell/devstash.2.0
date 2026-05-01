import Link from "next/link"
import { signIn } from "@/auth"
import { Button } from "@/components/ui/button"
import { RegisterForm } from "./register-form"
import { GitHubIcon } from "@/components/icons/github-icon"

async function signUpWithGitHub() {
  "use server"
  await signIn("github", { redirectTo: "/dashboard" })
}

export default function RegisterPage() {
  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
        <p className="text-sm text-muted-foreground">Start building your developer stash</p>
      </div>

      <RegisterForm />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">or</span>
        </div>
      </div>

      <form action={signUpWithGitHub}>
        <Button type="submit" variant="outline" className="w-full">
          <GitHubIcon className="mr-2 h-4 w-4" />
          Sign up with GitHub
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/sign-in" className="underline underline-offset-4 hover:text-foreground">
          Sign in
        </Link>
      </p>
    </div>
  )
}
