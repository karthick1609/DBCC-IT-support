const crypto = require('crypto')
const { supabaseService } = require('../../server/supabase')
const { sendEmail } = require('../../server/email')

const IST_OFFSET_MINUTES = 330
const MAX_TICKETS_IN_EMAIL = 100
const DEFAULT_RECIPIENT = 'karthick@dbcc.edu.in'

function getPreviousDayWindow(now = new Date()) {
  const istNow = new Date(now.getTime() + IST_OFFSET_MINUTES * 60 * 1000)
  const dayStartUtc = Date.UTC(
    istNow.getUTCFullYear(),
    istNow.getUTCMonth(),
    istNow.getUTCDate() - 1
  ) - IST_OFFSET_MINUTES * 60 * 1000
  const start = new Date(dayStartUtc)
  const end = new Date(dayStartUtc + 24 * 60 * 60 * 1000)
  const reportDate = new Date(dayStartUtc + IST_OFFSET_MINUTES * 60 * 1000)
  const label = [
    reportDate.getUTCFullYear(),
    String(reportDate.getUTCMonth() + 1).padStart(2, '0'),
    String(reportDate.getUTCDate()).padStart(2, '0')
  ].join('-')

  return { start, end, label }
}

async function fetchRows(table, columns, start, end, isTicketQuery) {
  const pageSize = 1000
  const rows = []

  for (let offset = 0; ; offset += pageSize) {
    let query = supabaseService.from(table).select(columns)
    if (isTicketQuery) {
      query = query
        .gte('created_at', start.toISOString())
        .lt('created_at', end.toISOString())
        .order('created_at', { ascending: true })
    }
    const { data, error } = await query.range(offset, offset + pageSize - 1)
    if (error) throw error
    rows.push(...data)
    if (data.length < pageSize) return rows
  }
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function countByStatus(rows) {
  return rows.reduce((counts, row) => {
    const status = row.status || 'Unspecified'
    counts[status] = (counts[status] || 0) + 1
    return counts
  }, {})
}

function buildReportHtml(reportDate, tickets, ticketStatuses, assetStatuses) {
  const statusRows = Object.entries(ticketStatuses)
    .map(([status, count]) => `<tr><td>${escapeHtml(status)}</td><td>${count}</td></tr>`)
    .join('')
  const assetRows = Object.entries(assetStatuses)
    .map(([status, count]) => `<tr><td>${escapeHtml(status)}</td><td>${count}</td></tr>`)
    .join('')
  const ticketRows = tickets.slice(0, MAX_TICKETS_IN_EMAIL)
    .map(ticket => `<tr><td>${escapeHtml(ticket.ticket_number)}</td><td>${escapeHtml(ticket.title)}</td><td>${escapeHtml(ticket.priority || 'Unspecified')}</td><td>${escapeHtml(ticket.status || 'Unspecified')}</td></tr>`)
    .join('')
  const omittedCount = tickets.length - Math.min(tickets.length, MAX_TICKETS_IN_EMAIL)

  return `
    <div style="font-family:Arial,sans-serif;color:#1f2937;line-height:1.5">
      <h2>DBASC IT Support - Daily Report</h2>
      <p>Activity for <strong>${escapeHtml(reportDate)}</strong> (India Standard Time).</p>
      <h3>New tickets (${tickets.length})</h3>
      ${tickets.length
        ? `<table cellpadding="8" cellspacing="0" border="1" style="border-collapse:collapse"><thead><tr><th>Ticket</th><th>Title</th><th>Priority</th><th>Status</th></tr></thead><tbody>${ticketRows}</tbody></table>`
        : '<p>No tickets were created during this reporting period.</p>'}
      ${omittedCount ? `<p>${omittedCount} additional tickets are not listed in this email.</p>` : ''}
      <h3>Current ticket status totals</h3>
      ${Object.keys(ticketStatuses).length
        ? `<table cellpadding="8" cellspacing="0" border="1" style="border-collapse:collapse"><thead><tr><th>Status</th><th>Count</th></tr></thead><tbody>${statusRows}</tbody></table>`
        : '<p>No tickets found.</p>'}
      <h3>Current asset status totals (${Object.values(assetStatuses).reduce((sum, count) => sum + count, 0)} assets)</h3>
      ${Object.keys(assetStatuses).length
        ? `<table cellpadding="8" cellspacing="0" border="1" style="border-collapse:collapse"><thead><tr><th>Status</th><th>Count</th></tr></thead><tbody>${assetRows}</tbody></table>`
        : '<p>No assets found.</p>'}
    </div>`
}

function isAuthorized(req) {
  const secret = process.env.CRON_SECRET
  const authorization = req.headers.authorization || ''
  const match = /^Bearer\s+(.+)$/i.exec(authorization)
  if (!secret || !match) return false

  const provided = Buffer.from(match[1])
  const expected = Buffer.from(secret)
  return provided.length === expected.length && crypto.timingSafeEqual(provided, expected)
}

async function sendDailyReport(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }
  if (!isAuthorized(req)) {
    return res.status(401).json({ success: false, message: 'Unauthorized scheduled report request.' })
  }
  if (!process.env.RESEND_API_KEY || !(process.env.RESEND_FROM_EMAIL || process.env.ADMIN_EMAIL)) {
    console.error('Daily report email is not configured: RESEND_API_KEY and a verified sender address are required.')
    return res.status(500).json({ success: false, message: 'Daily report email is not configured.' })
  }

  try {
    const { start, end, label } = getPreviousDayWindow()
    const [tickets, allTickets, assets] = await Promise.all([
      fetchRows('tickets', 'ticket_number,title,status,priority,created_at', start, end, true),
      fetchRows('tickets', 'status', null, null, false),
      fetchRows('assets', 'status', null, null, false)
    ])
    const result = await sendEmail(
      process.env.DAILY_REPORT_EMAIL || DEFAULT_RECIPIENT,
      `DBASC IT Support daily report - ${label}`,
      buildReportHtml(label, tickets, countByStatus(allTickets), countByStatus(assets))
    )
    if (result && result.error) throw result.error

    return res.status(200).json({ success: true, report_date: label, tickets_created: tickets.length })
  } catch (error) {
    console.error('Daily report generation or delivery failed:', error.message)
    return res.status(500).json({ success: false, message: 'Unable to generate or send the daily report.' })
  }
}

sendDailyReport.getPreviousDayWindow = getPreviousDayWindow
sendDailyReport.buildReportHtml = buildReportHtml

module.exports = sendDailyReport
