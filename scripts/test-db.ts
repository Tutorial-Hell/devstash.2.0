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

  // 3. Demo user
  console.log("\n✓ Demo user:")
  const user = await prisma.user.findUnique({
    where: { email: "demo@devstash.io" },
    include: { accounts: true },
  })

  if (!user) {
    throw new Error("Demo user not found — run `npx prisma db seed`")
  }

  console.log(`    email:         ${user.email}`)
  console.log(`    name:          ${user.name}`)
  console.log(`    emailVerified: ${user.emailVerified}`)
  console.log(`    isPro:         ${user.isPro}`)

  const credAccount = user.accounts.find((a) => a.provider === "credentials")
  if (!credAccount?.access_token) {
    throw new Error("Demo user has no password hash — account record missing or malformed")
  }
  console.log(`    password hash: ${credAccount.access_token.slice(0, 29)}...`)

  // 4. Collections with item counts
  console.log("\n✓ Collections:")
  const collections = await prisma.collection.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { items: true } },
    },
  })

  if (collections.length === 0) {
    throw new Error("No collections found — run `npx prisma db seed`")
  }

  for (const c of collections) {
    console.log(`    ${c.name.padEnd(24)} ${c._count.items} item(s)`)
  }

  // 5. Items breakdown by type
  console.log("\n✓ Items by type:")
  const itemsByType = await prisma.item.groupBy({
    by: ["itemTypeId"],
    where: { userId: user.id },
    _count: { id: true },
  })

  const typeIds = itemsByType.map((r) => r.itemTypeId)
  const typeRecords = await prisma.itemType.findMany({
    where: { id: { in: typeIds } },
  })
  const typeNameById = Object.fromEntries(typeRecords.map((t) => [t.id, t.name]))

  for (const row of itemsByType.sort((a, b) =>
    typeNameById[a.itemTypeId].localeCompare(typeNameById[b.itemTypeId])
  )) {
    console.log(`    ${typeNameById[row.itemTypeId].padEnd(12)} ${row._count.id} item(s)`)
  }

  // 6. Spot-check: verify each collection has the expected items
  console.log("\n✓ Item titles per collection:")
  const detailed = await prisma.collection.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
    include: {
      items: {
        include: {
          item: { include: { itemType: true } },
        },
      },
    },
  })

  for (const c of detailed) {
    console.log(`\n    ${c.name}`)
    for (const ci of c.items) {
      console.log(`      [${ci.item.itemType.name.padEnd(8)}] ${ci.item.title}`)
    }
  }

  // 7. Table counts
  console.log("\n✓ Table row counts:")
  const [userCount, itemCount, collectionCount, tagCount] = await Promise.all([
    prisma.user.count(),
    prisma.item.count(),
    prisma.collection.count(),
    prisma.tag.count(),
  ])
  console.log(`    users:       ${userCount}`)
  console.log(`    items:       ${itemCount}`)
  console.log(`    collections: ${collectionCount}`)
  console.log(`    tags:        ${tagCount}`)

  console.log("\nAll checks passed.")
}

main()
  .catch((e) => {
    console.error("\nDatabase test failed:", e.message ?? e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
