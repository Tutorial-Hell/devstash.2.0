"use client"

import { useState } from "react"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { FadeIn } from "./fade-in"

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

export function PricingSection() {
  const [isYearly, setIsYearly] = useState(false)

  return (
    <section id="pricing" className="py-24 bg-[#0a0a0f]">
      <div className="max-w-[1100px] mx-auto px-6">
        <FadeIn className="text-center mb-14">
          <p className="text-xs font-semibold tracking-[0.1em] uppercase text-[#3b82f6] mb-3">
            Simple pricing
          </p>
          <h2 className="text-[clamp(1.6rem,3vw,2.25rem)] font-bold tracking-[-0.02em] leading-[1.2]">
            Start free, upgrade when you&apos;re ready
          </h2>

          {/* Toggle */}
          <div className="flex items-center gap-3 justify-center mt-6">
            <span className={cn("text-sm cursor-pointer transition-colors", !isYearly ? "text-[#e2e8f0]" : "text-[#64748b]")}>
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
            <span className={cn("text-sm cursor-pointer transition-colors", isYearly ? "text-[#e2e8f0]" : "text-[#64748b]")}>
              Yearly{" "}
              <span className="bg-[#22c55e]/15 text-[#22c55e] text-[0.7rem] px-[0.4rem] py-[0.1rem] rounded font-semibold ml-1">
                Save 25%
              </span>
            </span>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-[700px] mx-auto">
          {/* Free */}
          <FadeIn>
            <div className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-8">
              <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b] mb-3">Free</div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-[2.5rem] font-extrabold tracking-[-0.03em]">$0</span>
                <span className="text-[#64748b] text-sm">/mo</span>
              </div>
              <div className="min-h-[1.1em] mb-6" />
              <ul className="flex flex-col gap-[0.65rem] mb-7">
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
                href="/register"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "w-full justify-center border-[#2e2e4e] text-[#94a3b8] hover:border-[#3b82f6] hover:text-[#3b82f6] bg-transparent"
                )}
              >
                Get Started Free
              </Link>
            </div>
          </FadeIn>

          {/* Pro */}
          <FadeIn>
            <div className="relative bg-gradient-to-b from-[#3b82f6]/[0.06] to-[#12121a] border border-[#3b82f6] rounded-xl p-8">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#3b82f6] text-white text-[0.7rem] font-bold uppercase tracking-[0.05em] px-3 py-[0.2rem] rounded-full whitespace-nowrap">
                Most Popular
              </span>
              <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b] mb-3">Pro</div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-[2.5rem] font-extrabold tracking-[-0.03em]">
                  {isYearly ? "$6" : "$8"}
                </span>
                <span className="text-[#64748b] text-sm">/mo</span>
              </div>
              <p className={cn("text-xs text-[#64748b] mb-6 min-h-[1.1em]", !isYearly && "invisible")}>
                billed $72/year
              </p>
              <ul className="flex flex-col gap-[0.65rem] mb-7">
                {PRO_FEATURES.map((text) => (
                  <li key={text} className="flex items-center gap-[0.6rem] text-sm">
                    <span className="text-[#22c55e] font-bold">✓</span>
                    {text}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className={cn(buttonVariants(), "w-full justify-center bg-[#3b82f6] hover:bg-[#2563eb] text-white border-0")}
              >
                Get Started
              </Link>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}
