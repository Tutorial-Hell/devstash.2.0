import { Suspense } from "react"
import Link from "next/link"
import { signIn } from "@/auth"
import { Button } from "@/components/ui/button"
import { SignInForm } from "./sign-in-form"
import { GitHubIcon } from "@/components/icons/github-icon"

async function signInWithGitHub() {
  "use server"
  await signIn("github", { redirectTo: "/dashboard" })
}

export default function SignInPage() {
  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Sign in to your DevStash account</p>
      </div>

      <Suspense>
        <SignInForm />
      </Suspense>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">or</span>
        </div>
      </div>

      <form action={signInWithGitHub}>
        <Button type="submit" variant="outline" className="w-full">
          <GitHubIcon className="mr-2 h-4 w-4" />
          Sign in with GitHub
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="underline underline-offset-4 hover:text-foreground">
          Register
        </Link>
      </p>
    </div>
  )
}
