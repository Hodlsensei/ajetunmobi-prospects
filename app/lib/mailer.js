import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendReminderEmail({ to, staffName, prospectName, phone, notes }) {
  await resend.emails.send({
    from: "Ajetunmobi Office <onboarding@resend.dev>",
    to,
    subject: `Follow-up Reminder: ${prospectName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; background: #f0ebe3; color: #1a1a1a; padding: 32px; border-radius: 12px;">
        <div style="background: #0d2b1d; width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
          <span style="color: #2db973; font-weight: bold; font-size: 18px;">A</span>
        </div>
        <h2 style="margin: 0 0 8px; color: #0d2b1d;">Follow-up Reminder</h2>
        <p style="color: #6b7280; margin: 0 0 24px;">Hi ${staffName}, you have a prospect to follow up with.</p>
        
        <div style="background: #ffffff; border: 1px solid #e0d8ce; border-radius: 10px; padding: 20px; margin-bottom: 24px;">
          <div style="margin-bottom: 12px;">
            <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Prospect Name</div>
            <div style="font-weight: 600; color: #0d2b1d;">${prospectName}</div>
          </div>
          <div style="margin-bottom: 12px;">
            <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Phone Number</div>
            <div style="color: #4a5568;">${phone}</div>
          </div>
          ${notes ? `
          <div>
            <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Notes</div>
            <div style="color: #4a5568;">${notes}</div>
          </div>
          ` : ""}
        </div>

        <p style="color: #6b7280; font-size: 13px;">Don't let this prospect go cold. Reach out today and keep the conversation going!</p>
        
        <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #e0d8ce; font-size: 11px; color: #9ca3af;">
          Ajetunmobi Office — Prospect Management System
        </div>
      </div>
    `
  })
}