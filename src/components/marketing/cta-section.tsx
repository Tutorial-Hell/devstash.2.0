import Link from "next/link"
import { FadeIn } from "./fade-in"

export function CtaSection() {
  return (
    <section className="py-24 bg-[radial-gradient(ellipse_at_50%_0%,rgba(59,130,246,0.12)_0%,transparent_70%)]">
      <div className="max-w-[1100px] mx-auto px-6">
        <FadeIn className="text-center">
          <h2 className="text-[clamp(1.8rem,3vw,2.5rem)] font-extrabold mb-4 tracking-[-0.02em]">
            Ready to organize your knowledge?
          </h2>
          <p className="text-[#94a3b8] mb-8 text-[1.05rem]">
            Join developers who stopped losing their best ideas.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-lg px-6 py-3 text-base font-medium bg-[#3b82f6] hover:bg-[#2563eb] text-white transition-colors"
          >
            Get Started Free
          </Link>
        </FadeIn>
      </div>
    </section>
  )
}
