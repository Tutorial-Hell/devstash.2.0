import Link from "next/link"
import { ResetPasswordForm } from "./reset-password-form"

interface Props {
  searchParams: Promise<{ token?: string }>
}

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token } = await searchParams

  if (!token) {
    return (
      <div className="w-full max-w-sm space-y-4 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Invalid link</h1>
        <p className="text-sm text-muted-foreground">
          This reset link is missing a token.{" "}
          <Link href="/forgot-password" className="underline underline-offset-4 hover:text-foreground">
            Request a new one
          </Link>
          .
        </p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Reset your password</h1>
        <p className="text-sm text-muted-foreground">Enter a new password for your account.</p>
      </div>

      <ResetPasswordForm token={token} />
    </div>
  )
}
