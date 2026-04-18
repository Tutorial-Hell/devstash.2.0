import { FadeIn } from "./fade-in"

const CHECKLIST = [
  {
    title: "Auto-tagging",
    desc: "AI reads your snippet and suggests relevant tags instantly.",
  },
  {
    title: "Smart summaries",
    desc: "Get a one-line description generated for any item you save.",
  },
  {
    title: "Semantic search",
    desc: "Find items by meaning, not just keywords.",
  },
  {
    title: "Collection suggestions",
    desc: "AI recommends which collections a new item belongs in.",
  },
]

const AI_TAGS = ["react", "hooks", "typescript", "debounce", "performance"]

export function AiSection() {
  return (
    <section className="py-24 bg-gradient-to-b from-[#0a0a0f] to-[#0d0d1a]">
      <div className="max-w-[1100px] mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        {/* Left */}
        <FadeIn>
          <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-[0.05em] text-white bg-gradient-to-r from-[#f59e0b] to-[#ef4444]">
            Pro Feature
          </span>
          <h2 className="text-[clamp(1.6rem,3vw,2.25rem)] font-bold tracking-[-0.02em] leading-[1.2] mt-4">
            Let AI do the organizing
          </h2>
          <ul className="flex flex-col gap-5 mt-7">
            {CHECKLIST.map(({ title, desc }) => (
              <li key={title} className="flex gap-4 items-start">
                <span className="w-6 h-6 rounded-full bg-[#22c55e]/15 text-[#22c55e] flex items-center justify-center text-xs font-bold flex-shrink-0 mt-[0.1rem]">
                  ✓
                </span>
                <div>
                  <strong className="block text-[0.95rem] mb-[0.15rem]">{title}</strong>
                  <p className="text-sm text-[#64748b] m-0">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </FadeIn>

        {/* Right — code mockup */}
        <FadeIn>
          <div className="bg-[#0d0d18] border border-[#1e1e2e] rounded-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-[0.6rem] bg-[#12121e] border-b border-[#1e1e2e]">
              <div className="flex gap-[5px]">
                <span className="w-[10px] h-[10px] rounded-full bg-[#ef4444] block" />
                <span className="w-[10px] h-[10px] rounded-full bg-[#f59e0b] block" />
                <span className="w-[10px] h-[10px] rounded-full bg-[#22c55e] block" />
              </div>
              <span className="ml-auto text-[0.7rem] text-[#64748b] font-mono">typescript</span>
            </div>

            {/* Code body */}
            <div className="px-5 py-4 font-mono text-[0.78rem] leading-[1.7] overflow-x-auto">
              <pre className="whitespace-pre">
                <span className="text-[#c084fc]">const</span>
                {" "}
                <span className="text-[#60a5fa]">useDebounce</span>
                <span className="text-[#e2e8f0]">{" = <T>("}</span>
                <span className="text-[#fb923c]">value</span>
                <span className="text-[#e2e8f0]">: T,</span>
                <span className="text-[#fb923c]"> delay</span>
                <span className="text-[#e2e8f0]">:</span>
                <span className="text-[#c084fc]"> number</span>
                <span className="text-[#e2e8f0]">{") => {"}</span>
                {"\n"}
                {"  "}
                <span className="text-[#c084fc]">const</span>
                <span className="text-[#e2e8f0]">{" [debouncedValue, setDebouncedValue]"}</span>
                {"\n"}
                {"    "}
                <span className="text-[#e2e8f0]">{"= useState<T>(value);"}</span>
                {"\n\n"}
                {"  "}
                <span className="text-[#60a5fa]">useEffect</span>
                <span className="text-[#e2e8f0]">{"(() => {"}</span>
                {"\n"}
                {"    "}
                <span className="text-[#c084fc]">const</span>
                <span className="text-[#e2e8f0]"> timer =</span>
                <span className="text-[#60a5fa]"> setTimeout</span>
                <span className="text-[#e2e8f0]">{"(() => {"}</span>
                {"\n"}
                {"      "}
                <span className="text-[#60a5fa]">setDebouncedValue</span>
                <span className="text-[#e2e8f0]">(value);</span>
                {"\n"}
                {"    "}
                <span className="text-[#e2e8f0]">{"}, delay);"}</span>
                {"\n"}
                {"    "}
                <span className="text-[#c084fc]">return</span>
                <span className="text-[#e2e8f0]">{" () =>"}</span>
                <span className="text-[#60a5fa]"> clearTimeout</span>
                <span className="text-[#e2e8f0]">(timer);</span>
                {"\n"}
                {"  "}
                <span className="text-[#e2e8f0]">{"}, [value, delay]);"}</span>
                {"\n\n"}
                {"  "}
                <span className="text-[#c084fc]">return</span>
                <span className="text-[#e2e8f0]"> debouncedValue;</span>
                {"\n"}
                <span className="text-[#e2e8f0]">{"}"}</span>
                <span className="text-[#e2e8f0]">;</span>
              </pre>
            </div>

            {/* AI tags bar */}
            <div className="px-5 py-3 bg-[#f59e0b]/5 border-t border-[#f59e0b]/20 flex items-center gap-3 flex-wrap">
              <span className="text-[0.72rem] text-[#f59e0b] font-semibold whitespace-nowrap">✨ AI Generated Tags</span>
              <div className="flex gap-[0.35rem] flex-wrap">
                {AI_TAGS.map((tag) => (
                  <span
                    key={tag}
                    className="bg-white/[0.07] border border-[#1e1e2e] rounded px-2 py-[0.15rem] text-[0.7rem] text-[#94a3b8] font-mono"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
