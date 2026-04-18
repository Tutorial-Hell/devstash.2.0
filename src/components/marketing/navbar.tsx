"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 640) setMenuOpen(false)
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [menuOpen])

  const closeMenu = () => setMenuOpen(false)

  useEffect(() => {
    if (!menuOpen) return
    const menu = menuRef.current
    if (!menu) return
    const focusable = menu.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    first?.focus()
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") { closeMenu(); return }
      if (e.key !== "Tab") return
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus() }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first?.focus() }
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [menuOpen])

  return (
    <>
      <nav
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-[background,border-color,backdrop-filter] duration-300",
          scrolled || menuOpen
            ? "bg-[#0a0a0f]/95 border-b border-[#1e1e2e] backdrop-blur-xl"
            : "bg-transparent border-b border-transparent"
        )}
      >
        <div className="max-w-[1100px] mx-auto px-6 py-4 flex items-center gap-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-[1.1rem] text-[#e2e8f0]">
            <span className="text-[1.2rem]">⚡</span>
            <span>DevStash</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden sm:flex gap-6 ml-2">
            <a href="#features" className="text-[#94a3b8] text-sm hover:text-[#e2e8f0] transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-[#94a3b8] text-sm hover:text-[#e2e8f0] transition-colors">
              Pricing
            </a>
          </div>

          {/* Desktop actions */}
          <div className="hidden sm:flex items-center gap-3 ml-auto">
            <Link
              href="/sign-in"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-[#94a3b8] hover:text-[#e2e8f0]")}
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className={cn(buttonVariants({ size: "sm" }), "bg-[#3b82f6] hover:bg-[#2563eb] text-white border-0")}
            >
              Get Started
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="sm:hidden ml-auto flex flex-col gap-[5px] p-1 cursor-pointer bg-transparent border-none"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span className={cn("block w-[22px] h-[2px] bg-[#94a3b8] rounded-sm transition-all duration-200", menuOpen && "rotate-45 translate-y-[7px]")} />
            <span className={cn("block w-[22px] h-[2px] bg-[#94a3b8] rounded-sm transition-all duration-200", menuOpen && "opacity-0")} />
            <span className={cn("block w-[22px] h-[2px] bg-[#94a3b8] rounded-sm transition-all duration-200", menuOpen && "-rotate-45 -translate-y-[7px]")} />
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div id="mobile-menu" ref={menuRef} className="sm:hidden flex flex-col px-2 pt-2 pb-4 border-t border-[#1e1e2e] gap-1">
            <a href="#features" onClick={closeMenu} className="px-4 py-3 rounded-lg text-[#e2e8f0] text-[0.95rem] bg-white/[0.04] hover:bg-white/[0.08] active:bg-[#3b82f6]/20 active:text-[#60a5fa] transition-colors">
              Features
            </a>
            <a href="#pricing" onClick={closeMenu} className="px-4 py-3 rounded-lg text-[#e2e8f0] text-[0.95rem] bg-white/[0.04] hover:bg-white/[0.08] active:bg-[#3b82f6]/20 active:text-[#60a5fa] transition-colors">
              Pricing
            </a>
            <Link href="/sign-in" onClick={closeMenu} className="px-4 py-3 rounded-lg text-[#e2e8f0] text-[0.95rem] bg-white/[0.04] hover:bg-white/[0.08] active:bg-[#3b82f6]/20 active:text-[#60a5fa] transition-colors">
              Sign In
            </Link>
            <Link
              href="/register"
              onClick={closeMenu}
              className={cn(buttonVariants(), "mt-4 bg-[#3b82f6] hover:bg-[#2563eb] active:bg-[#1d4ed8] text-white border-0 w-full justify-center")}
            >
              Get Started
            </Link>
          </div>
        )}
      </nav>

      {/* Overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm sm:hidden"
          onClick={closeMenu}
        />
      )}
    </>
  )
}
