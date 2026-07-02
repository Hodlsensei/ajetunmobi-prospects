import { PrismaClient } from "@prisma/client"
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"

const adapter = new PrismaBetterSqlite3({
  url: "file:./prisma/dev.db"
})
const prisma = new PrismaClient({ adapter })

export async function POST(req) {
  try {
    const { email, password } = await req.json()

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const passwordMatch = await bcrypt.compare(password, user.password)

    if (!passwordMatch) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    if (!user.active) {
      return NextResponse.json({ error: "Your account has been deactivated. Contact admin." }, { status: 403 })
   }

    const cookieStore = await cookies()
    cookieStore.set("user", JSON.stringify({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }), {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7
    })

    return NextResponse.json({ role: user.role })

  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}