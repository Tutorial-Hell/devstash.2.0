import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../src/generated/prisma/client"

const DEMO_EMAIL = "demo@devstash.io"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  const users = await prisma.user.findMany({
    where: { email: { not: DEMO_EMAIL } },
    select: { id: true, email: true },
  })

  if (users.length === 0) {
    console.log("No non-demo users found.")
    return
  }

  console.log(`Found ${users.length} user(s) to delete:`)
  users.forEach((u) => console.log(`  - ${u.email ?? "(no email)"} (${u.id})`))

  const ids = users.map((u) => u.id)

  // Delete cascades handle Items, Collections, Tags, Accounts, Sessions,
  // and EmailVerificationTokens via onDelete: Cascade on the User relation.
  // ItemCollections are covered by cascade on Item and Collection.
  const { count } = await prisma.user.deleteMany({ where: { id: { in: ids } } })

  console.log(`\nDeleted ${count} user(s) and all their associated content.`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
