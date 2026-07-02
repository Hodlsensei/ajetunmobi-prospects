import { PrismaClient } from "@prisma/client"
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

const adapter = new PrismaBetterSqlite3({ url: "file:./prisma/dev.db" })
const prisma = new PrismaClient({ adapter })

export async function PATCH(req, { params }) {
  try {
    const cookieStore = await cookies()
    const userCookie = cookieStore.get("user")
    if (!userCookie) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { status } = await req.json()
    const { id } = await params

    const prospect = await prisma.prospect.update({
      where: { id },
      data: { status }
    })

    return NextResponse.json({ prospect })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}