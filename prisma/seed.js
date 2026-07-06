import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pkg from "pg"
import bcrypt from "bcryptjs"
import * as dotenv from "dotenv"

dotenv.config()

const { Pool } = pkg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

const adapter = new PrismaPg(pool)
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