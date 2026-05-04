import Link from "next/link"
import { Button } from "@/components/ui/button"
import { GitHubIcon } from "@/components/icons/github-icon"

interface Props {
  title: string
  subtitle: string
  githubAction: () => Promise<void>
  githubLabel: string
  footerText: string
  footerLink: { href: string; label: string }
  children: React.ReactNode
}

export function AuthPageShell({
  title,
  subtitle,
  githubAction,
  githubLabel,
  footerText,
  footerLink,
  children,
}: Props) {
  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>

      {children}

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">or</span>
        </div>
      </div>

      <form action={githubAction}>
        <Button type="submit" variant="outline" className="w-full">
          <GitHubIcon className="mr-2 h-4 w-4" />
          {githubLabel}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {footerText}{" "}
        <Link href={footerLink.href} className="underline underline-offset-4 hover:text-foreground">
          {footerLink.label}
        </Link>
      </p>
    </div>
  )
}
