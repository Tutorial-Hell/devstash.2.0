import { randomBytes } from "crypto"
import { prisma } from "@/lib/prisma"

export async function createVerificationToken(userId: string): Promise<string> {
  // Delete any existing tokens for this user
  await prisma.emailVerificationToken.deleteMany({ where: { userId } })

  const token = randomBytes(32).toString("hex")
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  await prisma.emailVerificationToken.create({
    data: { userId, token, expires },
  })

  return token
}
