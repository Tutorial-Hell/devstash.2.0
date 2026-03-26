import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../src/generated/prisma/client"

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
})

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: "demo@devstash.io" },
    include: { accounts: true },
  })

  if (!user) {
    console.log("✗ Demo user not found")
    return
  }

  console.log("User:")
  console.log(`  id:            ${user.id}`)
  console.log(`  email:         ${user.email}`)
  console.log(`  emailVerified: ${user.emailVerified}`)

  console.log("\nAccounts:")
  if (user.accounts.length === 0) {
    console.log("  ✗ No account records found — password hash is missing")
    return
  }

  for (const a of user.accounts) {
    console.log(`  provider:           ${a.provider}`)
    console.log(`  providerAccountId:  ${a.providerAccountId}`)
    console.log(`  access_token:       ${a.access_token ? a.access_token.slice(0, 29) + "..." : "null"}`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
