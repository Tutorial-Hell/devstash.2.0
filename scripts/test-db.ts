import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../src/generated/prisma/client"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("Testing database connection...\n")

  // 1. Connection check
  await prisma.$queryRaw`SELECT 1`
  console.log("✓ Connected to database\n")

  // 2. System item types
  const systemTypes = await prisma.itemType.findMany({
    where: { isSystem: true },
    orderBy: { name: "asc" },
  })

  console.log(`✓ System item types (${systemTypes.length} found):`)
  for (const t of systemTypes) {
    console.log(`    ${t.color}  ${t.name.padEnd(10)} icon: ${t.icon}`)
  }

  // 3. Table counts
  console.log("\n✓ Table row counts:")
  const [users, items, collections, tags] = await Promise.all([
    prisma.user.count(),
    prisma.item.count(),
    prisma.collection.count(),
    prisma.tag.count(),
  ])
  console.log(`    users:       ${users}`)
  console.log(`    items:       ${items}`)
  console.log(`    collections: ${collections}`)
  console.log(`    tags:        ${tags}`)

  console.log("\nAll checks passed.")
}

main()
  .catch((e) => {
    console.error("Database test failed:", e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
