import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"

export function BackToDashboard({ className }: { className?: string }) {
  return (
    <Link
      href="/dashboard"
      className={cn("inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors", className)}
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      Dashboard
    </Link>
  )
}
