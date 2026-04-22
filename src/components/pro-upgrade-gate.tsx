"use client"

import { useState } from "react"
import Link from "next/link"
import { Lock, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createCheckoutSession } from "@/actions/subscription"

interface ProUpgradeGateProps {
  feature: "files" | "images"
}

export function ProUpgradeGate({ feature }: ProUpgradeGateProps) {
  const [loadingMonthly, setLoadingMonthly] = useState(false)
  const [loadingYearly, setLoadingYearly] = useState(false)

  async function handleUpgrade(priceId: string, setLoading: (v: boolean) => void) {
    setLoading(true)
    const { url, error } = await createCheckoutSession(priceId)
    setLoading(false)
    if (url) {
      window.location.href = url
    } else {
      console.error(error)
    }
  }

  const label = feature === "files" ? "File storage" : "Image storage"
  const description =
    feature === "files"
      ? "Store and access files directly in devstash. Upgrade to Pro to unlock file uploads."
      : "Store and access images directly in devstash. Upgrade to Pro to unlock image uploads."

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-6 max-w-md mx-auto">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
        <Lock className="h-7 w-7 text-muted-foreground" />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-center gap-2">
          <h1 className="text-2xl font-bold text-foreground">{label}</h1>
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-400 ring-1 ring-inset ring-blue-500/20">
            <Sparkles className="h-3 w-3" />
            Pro
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={() =>
            handleUpgrade(
              process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY!,
              setLoadingMonthly
            )
          }
          disabled={loadingMonthly || loadingYearly}
        >
          {loadingMonthly ? "Redirecting..." : "Upgrade Monthly — $8/mo"}
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            handleUpgrade(
              process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY!,
              setLoadingYearly
            )
          }
          disabled={loadingMonthly || loadingYearly}
        >
          {loadingYearly ? "Redirecting..." : "Upgrade Yearly — $72/yr"}
        </Button>
      </div>

      <Link
        href="/dashboard"
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        ← Back to Dashboard
      </Link>
    </div>
  )
}
