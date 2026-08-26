import { AppError } from '@server/lib/errors'
import { logger } from '@server/lib/logger'

const log = logger.child({ service: 'AuthEmail' })

async function sendEmail(to: string, subject: string, html: string) {
  log.debug({ to, subject }, 'sendEmail')
  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY!,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'DestacAI', email: process.env.BREVO_SENDER },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    })
    if (!res.ok) {
      throw new Error(`Brevo API error ${res.status}: ${await res.text()}`)
    }
  } catch (err) {
    log.error({ err, to, subject }, 'sendEmail failed')
    throw new AppError('Failed to send email', 500)
  }
}

export async function sendPasswordResetEmail(email: string, code: string) {
  await sendEmail(
    email,
    'Reset your DestacAI password',
    `
      <div style="font-family: Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f9fafb; border-radius: 12px;">
        <h1 style="font-size: 20px; color: #111; margin: 0 0 16px;">Reset your DestacAI password</h1>
        <p style="font-size: 15px; color: #555; margin: 0 0 24px;">Enter this code in DestacAI to reset your password. Expires in 1 hour.</p>
        <div style="background: #fff; border-radius: 8px; padding: 24px; text-align: center; border: 1px solid #e5e7eb;">
          <span style="font-size: 48px; font-weight: bold; letter-spacing: 8px; color: #111;">${code}</span>
        </div>
        <p style="font-size: 13px; color: #9ca3af; margin: 24px 0 0;">If you didn't request this, you can ignore this email.</p>
      </div>
    `,
  )
}
