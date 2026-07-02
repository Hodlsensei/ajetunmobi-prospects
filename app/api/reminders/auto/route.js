import { PrismaClient } from "@prisma/client"
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { sendReminderEmail } from "../../../lib/mailer"

const adapter = new PrismaBetterSqlite3({ url: "file:./prisma/dev.db" })
const prisma = new PrismaClient({ adapter })

export async function GET() {
  try {
    const cookieStore = await cookies()
    const userCookie = cookieStore.get("user")
    if (!userCookie) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = JSON.parse(userCookie.value)

    const threeDaysAgo = new Date(Date.now() - 3 * 60 * 1000)

    const staleProspects = await prisma.prospect.findMany({
      where: {
        userId: user.role === "staff" ? user.id : undefined,
        updatedAt: { lt: threeDaysAgo },
        status: { notIn: ["Converted", "Lost"] }
      },
      include: {
        addedBy: { select: { id: true, name: true, email: true } }
      }
    })

    for (const prospect of staleProspects) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const existingReminder = await prisma.reminder.findFirst({
        where: {
          prospectId: prospect.id,
          createdAt: { gte: today }
        }
      })

      if (!existingReminder) {
        // Notify staff in-app
        await prisma.notification.create({
          data: {
            userId: prospect.addedBy.id,
            message: `⏰ Follow-up reminder: ${prospect.firstName} ${prospect.lastName} hasn't been updated. Status: ${prospect.status}`
          }
        })

        // Send email to staff
        try {
          await sendReminderEmail({
            to: prospect.addedBy.email,
            staffName: prospect.addedBy.name,
            prospectName: `${prospect.firstName} ${prospect.lastName}`,
            phone: prospect.phone,
            notes: prospect.notes
          })
        } catch (emailErr) {
          console.error("Email failed:", emailErr)
        }

        // Notify all admins in-app
        const admins = await prisma.user.findMany({ where: { role: "admin" } })
        for (const admin of admins) {
          await prisma.notification.create({
            data: {
              userId: admin.id,
              message: `⏰ ${prospect.addedBy.name} needs to follow up with ${prospect.firstName} ${prospect.lastName} (${prospect.status}) — no update in 3+ days`
            }
          })
        }

        // Log the reminder
        await prisma.reminder.create({
          data: {
            prospectId: prospect.id,
            message: `Auto follow-up reminder for ${prospect.firstName} ${prospect.lastName}`,
            scheduledAt: new Date(),
            sentAt: new Date(),
            sent: true
          }
        })
      }
    }

    return NextResponse.json({ checked: staleProspects.length })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}