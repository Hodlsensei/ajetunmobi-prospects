import { PrismaClient } from "@prisma/client"
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import bcrypt from "bcryptjs"

const adapter = new PrismaBetterSqlite3({ url: "file:./prisma/dev.db" })
const prisma = new PrismaClient({ adapter })

export async function PATCH(req, { params }) {
  try {
    const cookieStore = await cookies()
    const userCookie = cookieStore.get("user")
    if (!userCookie) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const admin = JSON.parse(userCookie.value)
    if (admin.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { action, password } = await req.json()
    const { id } = await params

    const request = await prisma.accessRequest.findUnique({ where: { id } })
    if (!request) return NextResponse.json({ error: "Request not found" }, { status: 404 })

    if (action === "approve") {
      const hashedPassword = await bcrypt.hash(password, 10)
      await prisma.user.create({
        data: {
          name: request.name,
          email: request.email,
          password: hashedPassword,
          role: "staff",
          active: true
        }
      })

      await prisma.accessRequest.update({
        where: { id },
        data: { status: "Approved" }
      })

      return NextResponse.json({ success: true, message: "Staff account created" })
    }

    if (action === "reject") {
      await prisma.accessRequest.update({
        where: { id },
        data: { status: "Rejected" }
      })
      return NextResponse.json({ success: true, message: "Request rejected" })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}