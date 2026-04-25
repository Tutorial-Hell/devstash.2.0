"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Sparkles, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { createCheckoutSession } from "@/actions/subscription"

const FREE_FEATURES = [
  { included: true,  text: "Up to 50 items" },
  { included: true,  text: "3 collections" },
  { included: true,  text: "All item types" },
  { included: true,  text: "Full-text search" },
  { included: false, text: "AI features" },
  { included: false, text: "File uploads" },
]

const PRO_FEATURES = [
  "Unlimited items",
  "Unlimited collections",
  "All item types",
  "Full-text search",
  "AI auto-tagging",
  "File & image uploads",
]

export default function UpgradePage() {
  const router = useRouter()
  const [isYearly, setIsYearly] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleUpgrade() {
    setError(null)
    setLoading(true)
    const { url, error: err } = await createCheckoutSession(isYearly ? "yearly" : "monthly")
    setLoading(false)
    if (url) {
      window.location.href = url
    } else {
      setError(err ?? "Something went wrong. Please try again.")
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e2e8f0]">
      {/* Header */}
      <div className="border-b border-[#1e1e2e] px-6 py-4 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-[#94a3b8] hover:text-[#e2e8f0] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <span className="text-[#1e1e2e]">|</span>
        <div className="flex items-center gap-2">
          <span className="text-[1.1rem]">⚡</span>
          <span className="text-sm font-bold">DevStash</span>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[780px] mx-auto px-6 py-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 bg-[#3b82f6]/10 text-[#3b82f6] text-xs font-semibold px-3 py-1 rounded-full mb-2">
            <Sparkles className="h-3 w-3" />
            Upgrade to Pro
          </div>
          <h1 className="text-[clamp(1.4rem,2.5vw,1.9rem)] font-bold tracking-[-0.02em] leading-[1.2] mb-2">
            Start free, upgrade when you&apos;re ready
          </h1>
          <p className="text-[#94a3b8] text-sm max-w-md mx-auto">
            Unlock unlimited items, file & image uploads, and more.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="flex items-center gap-3 justify-center mb-6">
          <span
            className={cn("text-sm cursor-pointer transition-colors", !isYearly ? "text-[#e2e8f0]" : "text-[#64748b]")}
            onClick={() => setIsYearly(false)}
          >
            Monthly
          </span>
          <label className="relative w-[42px] h-[22px] cursor-pointer">
            <input
              type="checkbox"
              className="sr-only"
              checked={isYearly}
              onChange={(e) => setIsYearly(e.target.checked)}
            />
            <span
              className={cn(
                "absolute inset-0 rounded-full transition-colors duration-200",
                isYearly ? "bg-[#3b82f6]" : "bg-[#2e2e4e]"
              )}
            />
            <span
              className={cn(
                "absolute top-[3px] left-[3px] w-4 h-4 rounded-full bg-white transition-transform duration-200",
                isYearly && "translate-x-5"
              )}
            />
          </label>
          <span
            className={cn("text-sm cursor-pointer transition-colors", isYearly ? "text-[#e2e8f0]" : "text-[#64748b]")}
            onClick={() => setIsYearly(true)}
          >
            Yearly{" "}
            <span className="bg-[#22c55e]/15 text-[#22c55e] text-[0.7rem] px-[0.4rem] py-[0.1rem] rounded font-semibold ml-1">
              Save 25%
            </span>
          </span>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Free */}
          <div className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-6">
            <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[#94a3b8] mb-2">Free</div>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-[2rem] font-extrabold tracking-[-0.03em]">$0</span>
              <span className="text-[#94a3b8] text-sm">/mo</span>
            </div>
            <div className="min-h-[1.1em] mb-4" />
            <ul className="flex flex-col gap-[0.5rem] mb-5">
              {FREE_FEATURES.map(({ included, text }) => (
                <li key={text} className={cn("flex items-center gap-[0.6rem] text-sm", !included && "text-[#64748b]")}>
                  <span className={included ? "text-[#22c55e] font-bold" : "text-[#64748b]"}>
                    {included ? "✓" : "✗"}
                  </span>
                  {text}
                </li>
              ))}
            </ul>
            <Link
              href="/dashboard"
              className="flex w-full items-center justify-center rounded-md border border-[#2e2e4e] text-[#94a3b8] hover:border-[#3b82f6] hover:text-[#3b82f6] bg-transparent px-4 py-2 text-sm font-medium transition-colors"
            >
              Stay on Free
            </Link>
          </div>

          {/* Pro */}
          <div className="relative bg-gradient-to-b from-[#3b82f6]/[0.06] to-[#12121a] border border-[#3b82f6] rounded-xl p-6">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#3b82f6] text-white text-[0.7rem] font-bold uppercase tracking-[0.05em] px-3 py-[0.2rem] rounded-full whitespace-nowrap">
              Most Popular
            </span>
            <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[#94a3b8] mb-2">Pro</div>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-[2rem] font-extrabold tracking-[-0.03em]">
                {isYearly ? "$6" : "$8"}
              </span>
              <span className="text-[#94a3b8] text-sm">/mo</span>
            </div>
            <p className={cn("text-xs text-[#94a3b8] mb-4 min-h-[1.1em]", !isYearly && "invisible")}>
              billed $72/year
            </p>
            <ul className="flex flex-col gap-[0.5rem] mb-5">
              {PRO_FEATURES.map((text) => (
                <li key={text} className="flex items-center gap-[0.6rem] text-sm">
                  <span className="text-[#22c55e] font-bold">✓</span>
                  {text}
                </li>
              ))}
            </ul>
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="flex w-full items-center justify-center rounded-md bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-60 disabled:cursor-not-allowed text-white px-4 py-2 text-sm font-medium transition-colors"
            >
              {loading
                ? "Redirecting..."
                : isYearly
                ? "Upgrade — $72/year"
                : "Upgrade — $8/month"}
            </button>
            {error && (
              <p className="mt-3 text-xs text-red-400 text-center">{error}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
