"use client"

import { useEffect, useRef } from "react"

const ICONS = [
  { emoji: "📝", label: "Notion" },
  { emoji: "🐙", label: "GitHub" },
  { emoji: "💬", label: "Slack" },
  { emoji: "💻", label: "VS Code" },
  { emoji: "🌐", label: "Browser" },
  { emoji: "⬛", label: "Terminal" },
  { emoji: "📄", label: "Text file" },
  { emoji: "🔖", label: "Bookmark" },
]

type Particle = {
  emoji: string
  label: string
  x: number
  y: number
  vx: number
  vy: number
  size: number
  angle: number
  rotSpeed: number
  pulse: number
  pulseSpeed: number
  opacity: number
}

export function ChaosCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let particles: Particle[] = []
    let mouse = { x: -9999, y: -9999 }
    let animFrame: number

    function initParticles() {
      particles = ICONS.map((icon) => ({
        ...icon,
        x: Math.random() * (canvas!.width - 60) + 30,
        y: Math.random() * (canvas!.height - 60) + 30,
        vx: (Math.random() - 0.5) * 1.2,
        vy: (Math.random() - 0.5) * 1.2,
        size: 34 + Math.random() * 10,
        angle: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.03,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.03 + Math.random() * 0.02,
        opacity: 0.6 + Math.random() * 0.4,
      }))
    }

    function resize() {
      const rect = canvas!.parentElement!.getBoundingClientRect()
      canvas!.width = rect.width - 32
      canvas!.height = parseInt(canvas!.style.height || "220")
      initParticles()
    }

    function draw() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height)

      for (const p of particles) {
        const dx = p.x - mouse.x
        const dy = p.y - mouse.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        const repelRadius = 80
        if (dist < repelRadius && dist > 0) {
          const force = (repelRadius - dist) / repelRadius
          p.vx += (dx / dist) * force * 0.6
          p.vy += (dy / dist) * force * 0.6
        }

        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
        if (speed > 3) { p.vx *= 3 / speed; p.vy *= 3 / speed }

        p.vx *= 0.98
        p.vy *= 0.98

        p.x += p.vx
        p.y += p.vy
        p.angle += p.rotSpeed
        p.pulse += p.pulseSpeed

        const pad = p.size
        if (p.x < pad) { p.x = pad; p.vx = Math.abs(p.vx) }
        if (p.x > canvas!.width - pad) { p.x = canvas!.width - pad; p.vx = -Math.abs(p.vx) }
        if (p.y < pad) { p.y = pad; p.vy = Math.abs(p.vy) }
        if (p.y > canvas!.height - pad) { p.y = canvas!.height - pad; p.vy = -Math.abs(p.vy) }

        const scale = 1 + Math.sin(p.pulse) * 0.08
        ctx!.save()
        ctx!.translate(p.x, p.y)
        ctx!.rotate(p.angle)
        ctx!.globalAlpha = p.opacity
        ctx!.font = `${p.size * scale}px serif`
        ctx!.textAlign = "center"
        ctx!.textBaseline = "middle"
        ctx!.fillText(p.emoji, 0, 0)
        ctx!.restore()
      }

      animFrame = requestAnimationFrame(draw)
    }

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas!.getBoundingClientRect()
      mouse.x = e.clientX - rect.left
      mouse.y = e.clientY - rect.top
    }
    const onMouseLeave = () => { mouse.x = -9999; mouse.y = -9999 }
    const onTouchMove = (e: TouchEvent) => {
      const rect = canvas!.getBoundingClientRect()
      const t = e.touches[0]
      mouse.x = t.clientX - rect.left
      mouse.y = t.clientY - rect.top
    }

    canvas.addEventListener("mousemove", onMouseMove)
    canvas.addEventListener("mouseleave", onMouseLeave)
    canvas.addEventListener("touchmove", onTouchMove, { passive: true })

    const ro = new ResizeObserver(resize)
    ro.observe(canvas.parentElement!)
    resize()
    draw()

    return () => {
      cancelAnimationFrame(animFrame)
      ro.disconnect()
      canvas.removeEventListener("mousemove", onMouseMove)
      canvas.removeEventListener("mouseleave", onMouseLeave)
      canvas.removeEventListener("touchmove", onTouchMove)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ height: "220px" }}
      className="w-full block"
    />
  )
}
