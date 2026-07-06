import { prisma } from "../../lib/prisma.js"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const userCookie = cookieStore.get("user")
    if (!userCookie) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const staff = await prisma.user.findMany({
      where: { role: "staff" },
      include: {
        prospects: true,
        _count: { select: { prospects: true } }
      },
      orderBy: { createdAt: "asc" }
    })

    const leaderboard = staff.map(s => {
      const total = s.prospects.length
      const converted = s.prospects.filter(p => p.status === "Converted").length
      const hot = s.prospects.filter(p => p.score === "Hot").length
      const warm = s.prospects.filter(p => p.score === "Warm").length
      const cold = s.prospects.filter(p => p.score === "Cold").length
      const conversionRate = total > 0 ? Math.round((converted / total) * 100) : 0

      return { id: s.id, name: s.name, email: s.email, active: s.active, total, converted, hot, warm, cold, conversionRate }
    })

    leaderboard.sort((a, b) => b.total - a.total)

    return NextResponse.json({ leaderboard })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}