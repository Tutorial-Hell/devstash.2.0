import Link from "next/link"

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-[#1e1e2e] pt-14">
      <div className="max-w-[1100px] mx-auto px-6 flex flex-col md:flex-row gap-8 md:gap-16 items-start pb-12">
        {/* Brand */}
        <div className="flex-1">
          <Link href="/" className="flex items-center gap-2 font-bold text-[1.1rem] text-[#e2e8f0]">
            <span className="text-[1.2rem]">⚡</span>
            <span>DevStash</span>
          </Link>
          <p className="text-sm text-[#64748b] mt-3">Your developer knowledge hub.</p>
        </div>

        {/* Links */}
        <div className="flex gap-8 md:gap-12 flex-wrap">
          <div className="flex flex-col gap-[0.6rem]">
            <h4 className="text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-[#64748b] mb-1">Product</h4>
            <a href="#features" className="text-sm text-[#64748b] hover:text-[#e2e8f0] transition-colors">Features</a>
            <a href="#pricing" className="text-sm text-[#64748b] hover:text-[#e2e8f0] transition-colors">Pricing</a>
            <a href="#" className="text-sm text-[#64748b] hover:text-[#e2e8f0] transition-colors">Changelog</a>
          </div>
          <div className="flex flex-col gap-[0.6rem]">
            <h4 className="text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-[#64748b] mb-1">Company</h4>
            <a href="#" className="text-sm text-[#64748b] hover:text-[#e2e8f0] transition-colors">About</a>
            <a href="#" className="text-sm text-[#64748b] hover:text-[#e2e8f0] transition-colors">Blog</a>
            <a href="#" className="text-sm text-[#64748b] hover:text-[#e2e8f0] transition-colors">Contact</a>
          </div>
          <div className="flex flex-col gap-[0.6rem]">
            <h4 className="text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-[#64748b] mb-1">Legal</h4>
            <a href="#" className="text-sm text-[#64748b] hover:text-[#e2e8f0] transition-colors">Privacy</a>
            <a href="#" className="text-sm text-[#64748b] hover:text-[#e2e8f0] transition-colors">Terms</a>
          </div>
        </div>
      </div>

      <div className="border-t border-[#1e1e2e] py-5 px-6 text-center text-[0.8rem] text-[#64748b]">
        © {year} DevStash. All rights reserved.
      </div>
    </footer>
  )
}
