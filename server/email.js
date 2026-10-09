const { Resend } = require('resend')
require('dotenv').config()

let resend

async function sendEmail(to, subject, html) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set — skipping email')
    return null
  }
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY)
  return resend.emails.send({
    from: process.env.ADMIN_EMAIL || 'no-reply@example.com',
    to,
    subject,
    html
  })
}

module.exports = { sendEmail }
