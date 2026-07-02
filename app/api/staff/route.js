import { PrismaClient } from "@prisma/client"
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import bcrypt from "bcryptjs"

const adapter = new PrismaBetterSqlite3({ url: "file:./prisma/dev.db" })
const prisma = new PrismaClient({ adapter })

export async function GET() {
  try {
    const staff = await prisma.user.findMany({
      where: { role: "staff" },
      include: { _count: { select: { prospects: true } } },
      orderBy: { createdAt: "desc" }
    })
    return NextResponse.json({ staff })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const cookieStore = await cookies()
    const userCookie = cookieStore.get("user")
    if (!userCookie) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const admin = JSON.parse(userCookie.value)
    if (admin.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { name, email, password } = await req.json()

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return NextResponse.json({ error: "Email already exists" }, { status: 400 })

    const hashedPassword = await bcrypt.hash(password, 10)
    const staff = await prisma.user.create({
      data: { name, email, password: hashedPassword, role: "staff", active: true }
    })

    return NextResponse.json({ staff })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}