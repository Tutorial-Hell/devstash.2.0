import Link from "next/link"

export default function VerifyEmailPage() {
  return (
    <div className="w-full max-w-sm space-y-4 text-center">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Check your email</h1>
        <p className="text-sm text-muted-foreground">
          We sent a verification link to your email address. Click it to activate your account.
        </p>
      </div>

      <p className="text-xs text-muted-foreground">
        Didn&apos;t receive it? Check your spam folder or{" "}
        <Link href="/register" className="underline underline-offset-4 hover:text-foreground">
          register again
        </Link>
        .
      </p>

      <p className="text-xs text-muted-foreground">
        Already verified?{" "}
        <Link href="/sign-in" className="underline underline-offset-4 hover:text-foreground">
          Sign in
        </Link>
      </p>
    </div>
  )
}
