import { prisma } from "../../lib/prisma.js"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"


export async function POST(req) {
  try {
    const cookieStore = await cookies()
    const userCookie = cookieStore.get("user")
    if (!userCookie) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = JSON.parse(userCookie.value)
    const { message } = await req.json()

    const neolifeKnowledge = `
ABOUT NEOLIFE:
NeoLife is a global health and wellness company founded in 1958. They sell science-based nutritional supplements, weight management products, and personal care items. NeoLife operates on a network marketing model where members earn by selling products and building a team.

NEOLIFE NIGERIA BUSINESS:
Currency is Nigerian Naira. Members buy products at member price and sell at retail price. You earn retail profit plus bonuses from your team. Registration requires a one-time registration fee to become a member. You get a starter kit with products and business materials.

NEOLIFE RANKS:
Member is just joined. Bronze is building team. Silver is growing team. Gold is established leader. Ruby, Emerald, Diamond are top earners.

HOW TO JOIN:
Find a sponsor who is an existing NeoLife member. Pay registration fee. Buy your starter products. Start sharing products and recruiting.

KEY NEOLIFE PRODUCTS (Nigerian market):
Tre-en-en Grain Concentrates for energy and cell nutrition. Salmon Oil Plus for omega 3, heart and brain health. Formula IV Plus is a complete multivitamin. Carotenoid Complex for antioxidant and immunity. Pro Vitality+ is a combo pack for daily nutrition. NeoLifeShake for weight management and meal replacement. NeoLifeTea for energy and metabolism boost. Flavonoid Complex is anti-inflammatory. Vitamin C Sustained Release for immunity. Cal-Mag for calcium and magnesium for bones. Garlic Allium Complex for heart health. Joint Complex for joints and mobility. NeoLife Skin Care range for personal care.

BUSINESS OPPORTUNITY:
NeoLife gives you the chance to earn in Naira by helping people live healthier. You work your own hours, build your own team, and earn passive income as your team grows. Many Nigerians are making 6-7 figures monthly from NeoLife.

HANDLING OBJECTIONS:
If someone says it is a scam - NeoLife has been in business for over 60 years, operates in 50+ countries, and is registered in Nigeria. Real products, real company.
If someone says they don't have money - You can start small. The products sell themselves because they work.
If someone says they are too busy - NeoLife works around your schedule. Even 2 hours a day can build income.
If someone says network marketing doesn't work - NeoLife is product-based, not just recruitment. You earn from real product sales.
If someone says they don't know how to sell - NeoLife provides training, and your upline supports you every step.

PROSPECT APPROACH BY SCORE:
HOT prospect means they are ready to join or buy. Focus on closing, ask when they want to start, offer to register them immediately.
WARM prospect means they are interested but not decided. Share a success story, offer a product sample or trial, follow up in 2-3 days.
COLD prospect means they are not yet interested. Don't push. Plant a seed, share one benefit, leave them with curiosity, reconnect in a week.

FOLLOW UP TIPS:
Always follow up within 48 hours of first contact. Reference something personal they mentioned. Don't be desperate, be helpful and confident. Share testimonials and results. Invite them to a NeoLife event or presentation.
`

    let contextData = ""

    if (user.role === "admin") {
      const prospects = await prisma.prospect.findMany({
        include: { addedBy: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 50
      })
      const staff = await prisma.user.findMany({
        where: { role: "staff" },
        include: { _count: { select: { prospects: true } } }
      })

      contextData = `
You are an AI business assistant for Ajetunmobi Office, a NeoLife network marketing team in Nigeria.
You are talking to the ADMIN and TEAM LEADER.

${neolifeKnowledge}

CURRENT PROSPECTS DATA:
${JSON.stringify(prospects.map(p => ({
  name: `${p.firstName} ${p.lastName}`,
  phone: p.phone,
  company: p.company,
  status: p.status,
  score: p.score,
  addedBy: p.addedBy.name,
  notes: p.notes,
  date: p.createdAt
})))}

STAFF MEMBERS:
${JSON.stringify(staff.map(s => ({
  name: s.name,
  active: s.active,
  prospectsAdded: s._count.prospects
})))}

YOUR JOB:
Help the admin manage their NeoLife team and prospects.
Answer questions about NeoLife products, business, and team performance.
Be like a smart helpful friend - short, direct, conversational.
No bullet points. No markdown. No long paragraphs.
Max 3 sentences unless giving a follow up message script.
Speak naturally like a Nigerian business mentor.
      `
    } else {
      const prospects = await prisma.prospect.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" }
      })

      contextData = `
You are an AI business assistant for Ajetunmobi Office, a NeoLife network marketing team in Nigeria.
You are talking to a STAFF and TEAM MEMBER named ${user.name}.

${neolifeKnowledge}

THEIR PROSPECTS:
${JSON.stringify(prospects.map(p => ({
  name: `${p.firstName} ${p.lastName}`,
  phone: p.phone,
  company: p.company,
  status: p.status,
  score: p.score,
  notes: p.notes,
  date: p.createdAt
})))}

YOUR JOB:
Help this staff member follow up with their prospects and grow their NeoLife business.
Suggest follow up messages, handle objections, give sales tips.
Be like a smart helpful friend - short, direct, conversational.
No bullet points. No markdown. No long paragraphs.
Max 3 sentences unless giving a follow up message script.
Speak naturally like a Nigerian friend who knows NeoLife well.
      `
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 1024,
        messages: [
          { role: "system", content: contextData },
          { role: "user", content: message }
        ]
      })
    })

    const data = await response.json()
    const reply = data.choices?.[0]?.message?.content || "Sorry, I could not process that."

    return NextResponse.json({ reply })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}