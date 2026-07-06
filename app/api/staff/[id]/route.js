import { prisma } from "../../../lib/prisma.js"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function PATCH(req, { params }) {
  try {
    const cookieStore = await cookies()
    const userCookie = cookieStore.get("user")
    if (!userCookie) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { active } = await req.json()
    const { id } = await params

    const user = await prisma.user.update({
      where: { id },
      data: { active }
    })

    return NextResponse.json({ user })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}