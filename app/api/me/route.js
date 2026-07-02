import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const userCookie = cookieStore.get("user")
    if (!userCookie) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const user = JSON.parse(userCookie.value)
    return NextResponse.json({ user })
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}