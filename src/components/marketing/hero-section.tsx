import Link from "next/link"
import { FadeIn } from "./fade-in"
import { ChaosCanvas } from "./chaos-canvas"

const CARD_TYPES = [
  { accent: "#3b82f6", chip: "#3b82f6", label: "snippet" },
  { accent: "#f59e0b", chip: "#f59e0b", label: "prompt" },
  { accent: "#06b6d4", chip: "#06b6d4", label: "command" },
  { accent: "#22c55e", chip: "#22c55e", label: "note" },
  { accent: "#6366f1", chip: "#6366f1", label: "link" },
  { accent: "#ec4899", chip: "#ec4899", label: "image" },
]

export function HeroSection() {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-6 pt-28 pb-16 gap-16 max-w-[1100px] mx-auto">
      {/* Text block */}
      <FadeIn className="text-center max-w-[700px]">
        <h1 className="text-[clamp(2.2rem,5vw,3.5rem)] font-extrabold leading-[1.15] tracking-[-0.02em] mb-5">
          Stop Losing Your
          <br />
          <span className="bg-gradient-to-r from-[#3b82f6] via-[#60a5fa] to-[#93c5fd] bg-clip-text text-transparent">
            Developer Knowledge
          </span>
        </h1>
        <p className="text-[1.1rem] text-[#94a3b8] max-w-[560px] mx-auto mb-8">
          Your snippets are in GitHub Gists. Your prompts are in Notion. Your commands are in a random text file.
          DevStash brings it all into one searchable hub — built for developers.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-lg px-6 py-3 text-base font-medium bg-[#3b82f6] hover:bg-[#2563eb] text-white transition-colors"
          >
            Get Started Free
          </Link>
          <a
            href="#features"
            className="inline-flex items-center justify-center rounded-lg px-6 py-3 text-base font-medium text-[#94a3b8] hover:text-[#e2e8f0] transition-colors"
          >
            See How It Works
          </a>
        </div>
      </FadeIn>

      {/* Visual block */}
      <FadeIn className="flex items-center gap-6 w-full max-w-[960px] flex-col sm:flex-row">
        {/* Chaos box */}
        <div className="flex-1 bg-[#12121a] border border-[#1e1e2e] rounded-xl p-4 relative min-h-[280px] w-full">
          <p className="text-[0.85rem] text-[#94a3b8] mb-3 font-mono font-bold">Your knowledge today...</p>
          <ChaosCanvas />
        </div>

        {/* Arrow */}
        <div className="flex items-center justify-center flex-shrink-0 w-12">
          <span className="animate-pulse-arrow text-[2rem] text-[#3b82f6]">→</span>
        </div>

        {/* Dashboard mockup */}
        <div className="flex-1 bg-[#12121a] border border-[#1e1e2e] rounded-xl p-4 relative min-h-[280px] w-full">
          <p className="text-[0.85rem] text-[#94a3b8] mb-3 font-mono font-bold">...with DevStash</p>
          <div className="flex h-[220px] gap-2">
            {/* Sidebar */}
            <div className="w-[90px] flex flex-col gap-1 flex-shrink-0">
              {[
                { icon: "📦", label: "Snippets", active: true },
                { icon: "✨", label: "Prompts" },
                { icon: "⚡", label: "Commands" },
                { icon: "📝", label: "Notes" },
                { icon: "🔗", label: "Links" },
              ].map(({ icon, label, active }) => (
                <div
                  key={label}
                  className={`text-[0.6rem] px-2 py-[0.3rem] rounded truncate ${
                    active ? "bg-[#3b82f6]/15 text-[#3b82f6]" : "text-[#64748b]"
                  }`}
                >
                  {icon} {label}
                </div>
              ))}
            </div>

            {/* Main */}
            <div className="flex-1 flex flex-col gap-[6px] min-w-0">
              {/* Topbar */}
              <div className="flex items-center gap-[6px] flex-shrink-0">
                <div className="flex-1 flex items-center gap-[5px] bg-white/5 border border-[#1e1e2e] rounded px-[7px] py-[3px]">
                  <span className="text-[0.55rem]">🔍</span>
                  <div className="flex-1 h-1 rounded bg-white/10" />
                </div>
                <div className="bg-[#3b82f6] text-white text-[0.55rem] font-semibold px-[7px] py-[3px] rounded flex-shrink-0">
                  + New
                </div>
              </div>

              {/* Cards grid */}
              <div className="flex-1 grid grid-cols-2 gap-[5px] overflow-hidden">
                {CARD_TYPES.map(({ accent, chip, label }) => (
                  <div
                    key={label}
                    style={{ borderTopColor: accent } as React.CSSProperties}
                    className="bg-white/[0.03] border border-[#1e1e2e] border-t-2 rounded-md px-2 py-[0.4rem] flex flex-col gap-1"
                  >
                    <div className="h-[5px]" />
                    <div className="h-[3px] rounded bg-white/10 w-4/5" />
                    <div className="h-[3px] rounded bg-white/10 w-1/2" />
                    <div
                      className="mt-auto self-start text-[0.48rem] font-semibold px-[5px] py-px rounded uppercase tracking-[0.04em]"
                      style={{
                        color: chip,
                        background: `color-mix(in srgb, ${chip} 15%, transparent)`,
                        border: `1px solid color-mix(in srgb, ${chip} 30%, transparent)`,
                      }}
                    >
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </FadeIn>
    </section>
  )
}
