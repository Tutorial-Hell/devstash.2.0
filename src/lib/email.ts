import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
const FROM = "DevStash <onboarding@resend.dev>"

export async function sendVerificationEmail(email: string, token: string) {
  const url = `${APP_URL}/api/auth/verify-email?token=${token}`

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Verify your DevStash email",
    html: `
      <p>Thanks for signing up! Click the link below to verify your email address.</p>
      <p><a href="${url}">Verify my email</a></p>
      <p>This link expires in 24 hours. If you did not create an account, you can ignore this email.</p>
    `,
  })
}
