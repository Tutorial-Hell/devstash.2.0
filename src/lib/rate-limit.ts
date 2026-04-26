import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import { headers } from "next/headers"

type LimitConfig = {
  requests: number
  window: Parameters<typeof Ratelimit.slidingWindow>[1]
}

const LIMITS: Record<string, LimitConfig> = {
  login: { requests: 5, window: "15 m" },
  register: { requests: 3, window: "1 h" },
  "forgot-password": { requests: 3, window: "1 h" },
  "reset-password": { requests: 5, window: "15 m" },
  "resend-verification": { requests: 3, window: "15 m" },
  "ai-suggest-tags": { requests: 20, window: "1 h" },
}

let redis: Redis | null = null
const limiters = new Map<string, Ratelimit>()

function getRedis(): Redis | null {
  if (redis) return redis
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  redis = new Redis({ url, token })
  return redis
}

function getLimiter(type: string): Ratelimit | null {
  if (limiters.has(type)) return limiters.get(type)!
  const r = getRedis()
  if (!r) return null
  const config = LIMITS[type]
  const limiter = new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(config.requests, config.window),
    prefix: `rl:${type}`,
  })
  limiters.set(type, limiter)
  return limiter
}

export async function rateLimit(
  type: keyof typeof LIMITS,
  identifier: string
): Promise<{ success: boolean; retryAfterMinutes?: number }> {
  const limiter = getLimiter(type)
  if (!limiter) return { success: true } // fail open — Upstash not configured

  try {
    const result = await limiter.limit(identifier)
    if (!result.success) {
      const retryAfterMinutes = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000 / 60))
      return { success: false, retryAfterMinutes }
    }
    return { success: true }
  } catch {
    return { success: true } // fail open on Upstash errors
  }
}

/** Extract client IP from request headers (works in API routes and server actions). */
export async function getClientIp(request?: Request): Promise<string> {
  if (request) {
    const xff = request.headers.get("x-forwarded-for")
    if (xff) return xff.split(",")[0].trim()
    const realIp = request.headers.get("x-real-ip")
    if (realIp) return realIp.trim()
    return "unknown"
  }
  // Server actions: use next/headers
  const h = await headers()
  const xff = h.get("x-forwarded-for")
  if (xff) return xff.split(",")[0].trim()
  const realIp = h.get("x-real-ip")
  if (realIp) return realIp.trim()
  return "unknown"
}

export function rateLimitErrorMessage(retryAfterMinutes: number): string {
  return `Too many attempts. Please try again in ${retryAfterMinutes} minute${retryAfterMinutes === 1 ? "" : "s"}.`
}
