import { FadeIn } from "./fade-in"

const FEATURES = [
  {
    icon: "⌨️",
    accent: "#3b82f6",
    title: "Code Snippets",
    desc: "Save reusable code with syntax highlighting. Tag, search, and copy in one click.",
  },
  {
    icon: "✨",
    accent: "#f59e0b",
    title: "AI Prompts",
    desc: "Build a personal library of prompts that actually work. Never re-engineer the same prompt twice.",
  },
  {
    icon: "🔍",
    accent: "#6366f1",
    title: "Instant Search",
    desc: "Command palette across your entire knowledge base. Find anything in milliseconds.",
  },
  {
    icon: "⚡",
    accent: "#06b6d4",
    title: "Commands",
    desc: "Store shell commands, scripts, and one-liners with descriptions so you never Google the same thing again.",
  },
  {
    icon: "📁",
    accent: "#64748b",
    title: "Files & Docs",
    desc: "Upload and access reference files, PDFs, and images alongside your knowledge items.",
  },
  {
    icon: "📂",
    accent: "#22c55e",
    title: "Collections",
    desc: "Group related items into collections. Keep your React patterns, DevOps tools, and AI workflows organized.",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-[#0f0f1a]">
      <div className="max-w-[1100px] mx-auto px-6">
        <FadeIn className="text-center mb-14">
          <p className="text-xs font-semibold tracking-[0.1em] uppercase text-[#3b82f6] mb-3">
            Everything in one place
          </p>
          <h2 className="text-[clamp(1.6rem,3vw,2.25rem)] font-bold tracking-[-0.02em] leading-[1.2]">
            Built for the way developers actually work
          </h2>
        </FadeIn>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ icon, accent, title, desc }) => (
            <FadeIn key={title}>
              <div
                style={{ "--card-accent": accent } as React.CSSProperties}
                className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-7 transition-[border-color,background] duration-200 hover:border-[var(--card-accent)] hover:bg-[#1a1a26]"
              >
                <div
                  className="w-11 h-11 rounded-lg flex items-center justify-center text-xl mb-4"
                  style={{ background: `${accent}20`, color: accent }}
                >
                  {icon}
                </div>
                <h3 className="text-base font-semibold mb-2">{title}</h3>
                <p className="text-sm text-[#94a3b8] leading-relaxed">{desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
