"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { createCheckoutSession, createBillingPortalSession } from "@/actions/subscription"
import { FREE_ITEM_LIMIT, FREE_COLLECTION_LIMIT } from "@/lib/constants"

interface BillingSectionProps {
  totalItems: number
  totalCollections: number
}

export function BillingSection({ totalItems, totalCollections }: BillingSectionProps) {
  const { data: session } = useSession()
  const [loadingMonthly, setLoadingMonthly] = useState(false)
  const [loadingYearly, setLoadingYearly] = useState(false)
  const [loadingPortal, setLoadingPortal] = useState(false)

  const isPro = session?.user?.isPro ?? false

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

  async function handleManageBilling() {
    setLoadingPortal(true)
    const { url, error } = await createBillingPortalSession()
    setLoadingPortal(false)
    if (url) {
      window.location.href = url
    } else {
      console.error(error)
    }
  }

  if (isPro) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-400 ring-1 ring-inset ring-blue-500/20">
            Pro
          </span>
          <p className="text-sm text-foreground font-medium">You are on the Pro plan</p>
        </div>
        <p className="text-sm text-muted-foreground">
          Unlimited items, collections, and file uploads.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={handleManageBilling}
          disabled={loadingPortal}
        >
          {loadingPortal ? "Opening portal..." : "Manage Billing"}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-foreground font-medium">You are on the Free plan</p>
        <p className="text-sm text-muted-foreground mt-0.5">
          Upgrade to Pro for unlimited items, collections, and file uploads.
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Items</span>
          <span className="font-mono text-foreground">
            {totalItems} / {FREE_ITEM_LIMIT}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-blue-500 transition-all"
            style={{ width: `${Math.min(100, (totalItems / FREE_ITEM_LIMIT) * 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Collections</span>
          <span className="font-mono text-foreground">
            {totalCollections} / {FREE_COLLECTION_LIMIT}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-purple-500 transition-all"
            style={{ width: `${Math.min(100, (totalCollections / FREE_COLLECTION_LIMIT) * 100)}%` }}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          size="sm"
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
          size="sm"
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
    </div>
  )
}
