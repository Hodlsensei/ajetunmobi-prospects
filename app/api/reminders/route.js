import { prisma } from "../../lib/prisma.js"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { sendReminderEmail } from "../../lib/mailer.js"

export async function POST(req) {
  try {
    const cookieStore = await cookies()
    const userCookie = cookieStore.get("user")
    if (!userCookie) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const admin = JSON.parse(userCookie.value)
    if (admin.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { prospectId } = await req.json()

    const prospect = await prisma.prospect.findUnique({
      where: { id: prospectId },
      include: { addedBy: true }
    })

    if (!prospect) return NextResponse.json({ error: "Prospect not found" }, { status: 404 })

    await sendReminderEmail({
      to: prospect.addedBy.email,
      staffName: prospect.addedBy.name,
      prospectName: `${prospect.firstName} ${prospect.lastName}`,
      phone: prospect.phone,
      notes: prospect.notes
    })

    await prisma.reminder.create({
      data: {
        prospectId: prospect.id,
        message: `Follow-up reminder sent for ${prospect.firstName} ${prospect.lastName}`,
        scheduledAt: new Date(),
        sentAt: new Date(),
        sent: true
      }
    })

    await prisma.notification.create({
      data: {
        userId: admin.id,
        message: `Reminder sent to ${prospect.addedBy.name} for prospect ${prospect.firstName} ${prospect.lastName}`
      }
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}