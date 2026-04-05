# Auth Security Review

**Last audited:** 2026-04-05
**Auditor:** auth-auditor agent
**Scope:** NextAuth v5 credentials + GitHub OAuth, email verification, password reset, profile mutations

---

## Summary

6 findings: 0 Critical, 1 High, 2 Medium, 3 Low

---

## Findings

### [SEV-001] No rate limiting on any authentication endpoint
**Severity:** High
**Files:**
- `src/app/(auth)/sign-in/actions.ts`
- `src/app/(auth)/register/actions.ts`
- `src/app/api/auth/register/route.ts`
- `src/app/(auth)/forgot-password/actions.ts`
- `src/app/(auth)/reset-password/actions.ts`
- `src/app/(dashboard)/profile/actions.ts`
- `src/app/api/auth/verify-email/route.ts`

**Issue:** There is no rate limiting anywhere in the application. No packages (`@upstash/ratelimit`, `express-rate-limit`, custom middleware, etc.) are installed or referenced. Every sensitive authentication endpoint is open to unbounded automated requests:

- **Sign-in** (`credentialsSignInAction`): An attacker can brute-force credentials without restriction. The pre-check query runs on every attempt and the bcrypt comparison happens inside NextAuth's `authorize` callback — both execute on every request with no throttling.
- **Forgot-password** (`forgotPasswordAction`): An attacker can trigger unlimited password reset emails to any address, enabling email flooding/spam abuse.
- **Reset-password** (`resetPasswordAction`): Although tokens are cryptographically strong (see Passed Checks), the absence of per-token attempt limits means a future weaker token or logic bug would have no second line of defense.
- **Registration** (both the server action and the API route): An attacker can create unlimited accounts, exhausting database storage and triggering unlimited verification emails.
- **Email verification** (`/api/auth/verify-email`): The endpoint can be called in a tight loop; combined with the lack of token deletion on initial lookup, this does not introduce a direct attack vector today, but has no throttle.
- **Change-password** (`changePasswordAction`): Authenticated users can brute-force their own `currentPassword` check without restriction, which undermines the check's value.

**Fix:** Add request-level rate limiting using `@upstash/ratelimit` (for serverless/edge) or a similar library. Apply distinct limits per IP and per identifier:

```typescript
// Example using @upstash/ratelimit + Redis
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "15 m"), // 5 attempts per 15 minutes
})

// In sign-in action / forgot-password action:
const identifier = `signin:${email}` // per-email
const { success } = await ratelimit.limit(identifier)
if (!success) return { error: "Too many attempts. Please try again later." }
```

Recommended limits:
- Sign-in: 5 attempts per 15 minutes per email address
- Forgot-password: 3 requests per hour per email address
- Registration: 10 per hour per IP
- Reset-password: 5 attempts per token (or per IP) per hour

---

### [SEV-002] Password reset token stored in plaintext in the database
**Severity:** Medium
**File:** `src/app/(auth)/forgot-password/actions.ts` (line 34)

**Issue:** The 64-character hex password reset token is written directly to `VerificationToken.token` without hashing. If the database is compromised (SQL injection elsewhere, leaked backup, misconfigured Neon connection string), an attacker can read any pending reset token and use it to take over the corresponding account within the 1-hour TTL window. This is a real post-compromise escalation path — a read-only DB leak becomes a full account takeover for any user with a pending reset.

The email verification tokens are stored in the separate `EmailVerificationToken` table under the same plaintext pattern (`src/lib/verification-token.ts` line 8), but the impact is lower there since exploiting it only grants email verification, not account access.

**Fix:** Store only a SHA-256 hash of the token in the database. Send the raw token in the email. On lookup, hash the incoming token and compare:

```typescript
import { createHash, randomBytes } from "crypto"

// When creating:
const rawToken = randomBytes(32).toString("hex")
const hashedToken = createHash("sha256").update(rawToken).digest("hex")

await prisma.verificationToken.create({
  data: { identifier: email, token: hashedToken, expires },
})

sendPasswordResetEmail(email, rawToken) // send raw token in email

// When verifying (resetPasswordAction):
const hashedToken = createHash("sha256").update(token).digest("hex")
const record = await prisma.verificationToken.findUnique({ where: { token: hashedToken } })
```

Apply the same pattern to `EmailVerificationToken` in `src/lib/verification-token.ts`.

---

### [SEV-003] Missing `token` emptiness check before database lookup in `resetPasswordAction`
**Severity:** Medium
**File:** `src/app/(auth)/reset-password/actions.ts` (lines 11, 27)

**Issue:** The token is read from `formData` with `as string`, which means if the field is absent or the form is submitted without a token, `token` becomes the empty string `""`. The guard checks `!password || !confirmPassword` but does NOT check `!token`. The code then executes:

```typescript
const record = await prisma.verificationToken.findUnique({ where: { token } })
```

with `token = ""`. Prisma's `findUnique` on a `@unique` column with an empty string will perform a real database query matching against any row where `token = ""`. Under normal circumstances no such row exists, so `record` is `null` and the function returns an error. However, this is a latent bug: if any code path ever inserts a row with an empty token string (e.g., due to a future bug or migration), this query would match it and allow a password reset without a valid token. Explicitly validating that `token` is non-empty before querying is the correct defensive pattern.

**Fix:** Add an explicit guard before the `findUnique` call:

```typescript
const token = formData.get("token") as string

if (!token) {
  return { error: "Invalid or expired reset link. Please request a new one." }
}
```

---

### [SEV-004] User enumeration via sign-in pre-check
**Severity:** Low
**File:** `src/app/(auth)/sign-in/actions.ts` (lines 16–20)

**Issue:** When `EMAIL_VERIFICATION_ENABLED` is true, the action queries the database for the email before calling `signIn`. The response differs based on account state:

- Email not registered at all → `signIn` returns an `AuthError` → `"Invalid email or password."`
- Email registered with a password but not verified → `"Please verify your email before signing in. Check your inbox."`
- Email registered via OAuth only (no password) → `signIn` returns an `AuthError` → `"Invalid email or password."`
- Email registered, verified, wrong password → `"Invalid email or password."`

The second case reveals that the email address is registered and is a credentials account awaiting verification. An attacker can reliably distinguish registered-but-unverified accounts from non-existent accounts. This is a real, exploitable enumeration vector when `EMAIL_VERIFICATION_ENABLED=true`.

**Fix:** One option is to let NextAuth's `authorize` callback handle the unverified-email case and surface a generic error. If a specific UI message is required for unverified users, consider rate-limiting this endpoint aggressively (see SEV-001) and accepting the trade-off, or gating the specific message on a successful password check first so the enumeration requires knowing the password.

---

### [SEV-005] User enumeration at registration
**Severity:** Low
**Files:**
- `src/app/(auth)/register/actions.ts` (line 30)
- `src/app/api/auth/register/route.ts` (lines 25–27)

**Issue:** Both registration paths return a distinct error message (`"Email already registered."` / HTTP 409) when the submitted email already exists. An attacker can probe arbitrary email addresses to determine which are registered in the system.

This is an extremely common trade-off for UX reasons — users need to know to sign in rather than register — but it is a real, exploitable enumeration issue from a pure security standpoint.

**Fix:** The typical mitigation is to return the same success-like message regardless ("If that email is not already registered, you will receive a confirmation shortly"), redirect to a pending-verification page, and send a "you already have an account" notification email to the existing address. However, this significantly degrades UX. If enumeration is accepted as a trade-off here, document the decision explicitly.

---

### [SEV-006] `APP_URL` environment variable in email templates not validated
**Severity:** Low
**File:** `src/lib/email.ts` (lines 5, 9, 24)

**Issue:** `APP_URL` is read from `NEXT_PUBLIC_APP_URL` with a localhost fallback and interpolated directly into HTML email link hrefs:

```typescript
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
const url = `${APP_URL}/reset-password?token=${token}`
```

If `NEXT_PUBLIC_APP_URL` is misconfigured or set to a value like `javascript:alert(1)//` or a malicious domain in a compromised environment (e.g., a CI/CD secret injection attack), the generated `href` would point to an attacker-controlled URL. The token values (64-char hex) and email addresses are not capable of HTML injection. The risk here is purely in the server environment configuration.

This is a Low finding because it requires an attacker to already control the server environment, but it is worth noting.

**Fix:** Validate `APP_URL` at startup to ensure it begins with `https://` (or `http://` for local dev) and matches an expected domain:

```typescript
const APP_URL = (() => {
  const url = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    throw new Error(`NEXT_PUBLIC_APP_URL is not a valid URL: ${url}`)
  }
  return url.replace(/\/$/, "") // strip trailing slash
})()
```

---

## Passed Checks

- **Bcrypt cost factor:** All four code paths that create or update passwords — `registerAction`, the register API route, `resetPasswordAction`, and `changePasswordAction` — use `bcrypt.hash(password, 12)`. Cost factor 12 is above the minimum threshold of 10 and appropriate for production use.

- **Token generation (cryptographic strength):** Both the email verification token (`src/lib/verification-token.ts`) and the password reset token (`src/app/(auth)/forgot-password/actions.ts`) use `randomBytes(32).toString("hex")` from Node's built-in `crypto` module, producing 256 bits of entropy as a 64-character hex string. This is cryptographically secure and unguessable.

- **Token expiration — email verification:** TTL is 24 hours (set in `createVerificationToken`). The expiration is checked before use in `src/app/api/auth/verify-email/route.ts` (line 17), and expired tokens are deleted immediately.

- **Token expiration — password reset:** TTL is 1 hour (set in `forgotPasswordAction`). The expiration is checked before use in `resetPasswordAction` (line 33), and expired tokens are deleted immediately.

- **Single-use enforcement — email verification:** The token is deleted in `src/app/api/auth/verify-email/route.ts` immediately after the user record is updated (line 27). The two operations are sequential but not transactional; however, because `emailVerified` is set first and the `authorize` callback checks this field, a race condition here would at worst result in a "token already used" error on the second concurrent request, with no security consequence.

- **Single-use enforcement — password reset:** The token deletion and the password update are wrapped in a `prisma.$transaction([...])` in `resetPasswordAction` (lines 46–49). This is the correct pattern — the token is invalidated atomically with the password change, preventing double-use via a race condition.

- **Forgot-password user enumeration:** `forgotPasswordAction` returns `{ success: true }` for both the "user not found" and "user is OAuth-only" cases, indistinguishable from a successful token dispatch. This correctly prevents enumeration through the forgot-password endpoint.

- **OAuth-only account protection on password reset:** `forgotPasswordAction` checks `!user.password` and returns early with `{ success: true }` before issuing any token. An attacker cannot trigger a password reset for a GitHub-only account.

- **Session validation in profile actions:** Both `changePasswordAction` and `deleteAccountAction` in `src/app/(dashboard)/profile/actions.ts` call `await auth()` and gate execution on `session?.user?.id`. Database mutations are scoped to `session.user.id`, not to any client-supplied identifier. No IDOR is possible.

- **Middleware route protection:** `src/middleware.ts` protects `/dashboard/:path*` and `/profile` via the `matcher` config. These are the only routes that should require authentication based on the project structure.

- **Shared VerificationToken table collision:** The app uses JWT sessions and only the GitHub (OAuth) and Credentials providers — no NextAuth Email/magic-link provider is configured. NextAuth itself never writes to the `VerificationToken` table in this configuration. The custom password reset code is the sole writer, so no token collision with NextAuth internals is possible.

- **Email template injection:** The only dynamic values interpolated into email HTML are the hex token (64 hex chars — incapable of HTML injection) and the APP_URL (see SEV-006 for a low-severity environment config note). User-supplied values such as name or email address are not interpolated into the HTML body. No XSS vector exists in the email templates as currently written.
