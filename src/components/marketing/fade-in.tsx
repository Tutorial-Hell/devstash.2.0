"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface FadeInProps {
  children: React.ReactNode
  className?: string
}

export function FadeIn({ children, className }: FadeInProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setReady(true)
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          obs.unobserve(el)
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={cn(
        ready && "transition-[opacity,transform] duration-700 ease-out",
        ready && !visible && "opacity-0 translate-y-6",
        className
      )}
    >
      {children}
    </div>
  )
}
