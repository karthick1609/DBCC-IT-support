const assert = require('assert')

const supabasePath = require.resolve('../server/supabase')
const emailPath = require.resolve('../server/email')
const ticketsCreated = [{
  ticket_number: 'DB-HD-001',
  title: '<Printer> issue',
  status: 'Open',
  priority: 'High',
  created_at: '2026-10-08T18:30:00.000Z'
}]
const calls = []

function queryFor(table) {
  const query = {
    select(columns) {
      calls.push({ table, columns })
      return query
    },
    gte(column, value) {
      calls.push({ method: 'gte', column, value })
      return query
    },
    lt(column, value) {
      calls.push({ method: 'lt', column, value })
      return query
    },
    order(column, options) {
      calls.push({ method: 'order', column, options })
      return query
    },
    range() {
      const data = table === 'assets'
        ? [{ status: 'Active' }, { status: 'Active' }, { status: 'Repair' }]
        : calls.some(call => call.table === table && call.columns === 'ticket_number,title,status,priority,created_at')
          ? ticketsCreated
          : [{ status: 'Open' }, { status: 'Completed' }, { status: 'Open' }]
      return Promise.resolve({ data, error: null })
    }
  }
  return query
}

let emailMessage
require.cache[supabasePath] = {
  id: supabasePath,
  filename: supabasePath,
  loaded: true,
  exports: { supabaseService: { from: table => queryFor(table) } }
}
require.cache[emailPath] = {
  id: emailPath,
  filename: emailPath,
  loaded: true,
  exports: {
    sendEmail: async (to, subject, html) => {
      emailMessage = { to, subject, html }
      return { data: { id: 'email-1' }, error: null }
    }
  }
}

const sendDailyReport = require('../api/reports/daily-email')

function mockResponse() {
  return {
    statusCode: 200,
    body: null,
    headers: {},
    setHeader(name, value) {
      this.headers[name] = value
    },
    status(code) {
      this.statusCode = code
      return this
    },
    json(body) {
      this.body = body
      return this
    }
  }
}

async function run() {
  const window = sendDailyReport.getPreviousDayWindow(new Date('2026-10-09T02:00:00.000Z'))
  assert.strictEqual(window.label, '2026-10-08')
  assert.strictEqual(window.start.toISOString(), '2026-10-07T18:30:00.000Z')
  assert.strictEqual(window.end.toISOString(), '2026-10-08T18:30:00.000Z')
  assert.match(
    sendDailyReport.buildReportHtml('2026-10-08', ticketsCreated, { Open: 2 }, { Active: 1 }),
    /&lt;Printer&gt; issue/
  )

  const priorSecret = process.env.CRON_SECRET
  const priorApiKey = process.env.RESEND_API_KEY
  const priorSender = process.env.RESEND_FROM_EMAIL
  const priorAdminEmail = process.env.ADMIN_EMAIL
  process.env.CRON_SECRET = 'test-secret'
  process.env.RESEND_API_KEY = 'test-api-key'
  delete process.env.RESEND_FROM_EMAIL
  process.env.ADMIN_EMAIL = 'verified@example.com'
  try {
    const denied = mockResponse()
    await sendDailyReport({ method: 'GET', headers: { authorization: 'Bearer wrong-secret' } }, denied)
    assert.strictEqual(denied.statusCode, 401)

    const method = mockResponse()
    await sendDailyReport({ method: 'POST', headers: {} }, method)
    assert.strictEqual(method.statusCode, 405)
    assert.strictEqual(method.headers.Allow, 'GET')

    const response = mockResponse()
    await sendDailyReport({ method: 'GET', headers: { authorization: 'Bearer test-secret' } }, response)
    assert.strictEqual(response.statusCode, 200)
    assert.deepStrictEqual(response.body, {
      success: true,
      report_date: sendDailyReport.getPreviousDayWindow().label,
      tickets_created: 1
    })
    assert.strictEqual(emailMessage.to, 'karthick@dbcc.edu.in')
    assert.match(emailMessage.subject, /^DBASC IT Support daily report - /)
    assert.match(emailMessage.html, /Current ticket status totals/)
    assert.match(emailMessage.html, /Current asset status totals \(3 assets\)/)
    assert(calls.some(call => call.method === 'gte' && call.value === sendDailyReport.getPreviousDayWindow().start.toISOString()))
    console.log('Daily email report validation passed.')
  } finally {
    if (priorSecret === undefined) delete process.env.CRON_SECRET
    else process.env.CRON_SECRET = priorSecret
    if (priorApiKey === undefined) delete process.env.RESEND_API_KEY
    else process.env.RESEND_API_KEY = priorApiKey
    if (priorSender === undefined) delete process.env.RESEND_FROM_EMAIL
    else process.env.RESEND_FROM_EMAIL = priorSender
    if (priorAdminEmail === undefined) delete process.env.ADMIN_EMAIL
    else process.env.ADMIN_EMAIL = priorAdminEmail
  }
}

run().catch(error => {
  console.error('Daily email report validation failed:', error.message)
  process.exitCode = 1
})
