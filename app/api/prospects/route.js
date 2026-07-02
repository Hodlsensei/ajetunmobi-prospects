import { PrismaClient } from "@prisma/client"
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

const adapter = new PrismaBetterSqlite3({
  url: "file:./prisma/dev.db"
})
const prisma = new PrismaClient({ adapter })

export async function POST(req) {
  try {
    const cookieStore = await cookies()
    const userCookie = cookieStore.get("user")

    if (!userCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = JSON.parse(userCookie.value)
    const body = await req.json()

    const prospect = await prisma.prospect.create({
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        phone: body.phone,
        email: body.email || null,
        company: body.company || null,
        notes: body.notes || null,
        score: body.score || "Warm",
        status: "New",
        userId: user.id
      }
    })

    // Create notification for admin
    const admins = await prisma.user.findMany({
      where: { role: "admin" }
    })

    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          message: `${user.name} added a new prospect: ${body.firstName} ${body.lastName}`
        }
      })
    }

    return NextResponse.json({ prospect })

  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function GET(req) {
  try {
    const cookieStore = await cookies()
    const userCookie = cookieStore.get("user")

    if (!userCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const prospects = await prisma.prospect.findMany({
      include: { addedBy: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json({ prospects })

  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}