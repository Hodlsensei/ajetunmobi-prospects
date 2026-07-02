import { PrismaClient } from "@prisma/client"
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"
import bcrypt from "bcryptjs"

const adapter = new PrismaBetterSqlite3({
  url: "file:./prisma/dev.db"
})

const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("Seeding database...")

  const adminPassword = await bcrypt.hash("admin123", 10)
  const admin = await prisma.user.upsert({
    where: { email: "admin@ajetunmobi.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@ajetunmobi.com",
      password: adminPassword,
      role: "admin"
    }
  })

  const staffPassword = await bcrypt.hash("staff123", 10)

  const staff1 = await prisma.user.upsert({
    where: { email: "john@ajetunmobi.com" },
    update: {},
    create: {
      name: "John Adeyemi",
      email: "john@ajetunmobi.com",
      password: staffPassword,
      role: "staff"
    }
  })

  const staff2 = await prisma.user.upsert({
    where: { email: "sarah@ajetunmobi.com" },
    update: {},
    create: {
      name: "Sarah Bello",
      email: "sarah@ajetunmobi.com",
      password: staffPassword,
      role: "staff"
    }
  })

  console.log("✅ Admin created:", admin.email)
  console.log("✅ Staff created:", staff1.email)
  console.log("✅ Staff created:", staff2.email)
  console.log("🎉 Database seeded successfully!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })