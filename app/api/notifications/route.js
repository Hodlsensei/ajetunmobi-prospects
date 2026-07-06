import { prisma } from "../../lib/prisma.js"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const userCookie = cookieStore.get("user")
    if (!userCookie) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = JSON.parse(userCookie.value)
    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20
    })

    return NextResponse.json({ notifications })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function PATCH() {
  try {
    const cookieStore = await cookies()
    const userCookie = cookieStore.get("user")
    if (!userCookie) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = JSON.parse(userCookie.value)
    await prisma.notification.updateMany({
      where: { userId: user.id, read: false },
      data: { read: true }
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies()
    const userCookie = cookieStore.get("user")
    if (!userCookie) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = JSON.parse(userCookie.value)
    await prisma.notification.deleteMany({
      where: { userId: user.id }
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}