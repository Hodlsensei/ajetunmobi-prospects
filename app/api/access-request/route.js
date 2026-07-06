import { prisma } from "../../lib/prisma.js"
import { NextResponse } from "next/server"

export async function POST(req) {
  try {
    const { name, email } = await req.json()

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 400 })
    }

    const existingRequest = await prisma.accessRequest.findUnique({ where: { email } })
    if (existingRequest) {
      return NextResponse.json({ error: "A request with this email already exists" }, { status: 400 })
    }

    const request = await prisma.accessRequest.create({
      data: { name, email }
    })

    const admins = await prisma.user.findMany({ where: { role: "admin" } })
    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          message: `New access request from ${name} (${email})`
        }
      })
    }

    return NextResponse.json({ success: true, request })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const requests = await prisma.accessRequest.findMany({
      orderBy: { createdAt: "desc" }
    })
    return NextResponse.json({ requests })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}