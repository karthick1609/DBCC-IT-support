const assert = require('assert')

const supabasePath = require.resolve('../server/supabase')
const authPath = require.resolve('../server/auth')
let currentStatus = 'Open'
let updatePayload = null
let currentRole = 'admin'

const supabaseService = {
  from(table) {
    assert.strictEqual(table, 'tickets')
    return {
      select() {
        return {
          eq(column, value) {
            assert.strictEqual(column, 'id')
            assert.strictEqual(value, 'ticket-1')
            return {
              maybeSingle: async () => ({ data: { id: value, status: currentStatus }, error: null }),
              select() {
                return {
                  single: async () => ({
                    data: { id: 'ticket-1', ticket_number: 'DB-HD-TEST', status: updatePayload.status },
                    error: null
                  })
                }
              }
            }
          }
        }
      },
      update(payload) {
        updatePayload = payload
        return {
          eq(column, value) {
            assert.strictEqual(column, 'id')
            assert.strictEqual(value, 'ticket-1')
            return {
              select() {
                return {
                  single: async () => ({
                    data: { id: 'ticket-1', ticket_number: 'DB-HD-TEST', status: updatePayload.status },
                    error: null
                  })
                }
              }
            }
          }
        }
      }
    }
  }
}

require.cache[supabasePath] = {
  id: supabasePath,
  filename: supabasePath,
  loaded: true,
  exports: { supabaseService }
}
require.cache[authPath] = {
  id: authPath,
  filename: authPath,
  loaded: true,
  exports: {
    requireRole: async (req, res, roles) => {
      if (!roles.includes(currentRole)) {
        res.status(403).json({ success: false, message: 'Forbidden' })
        return null
      }
      return { profile: { id: 'admin-1', role: currentRole } }
    }
  }
}

const updateTicket = require('../api/tickets/[id]')

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

async function changeStatus(status) {
  const response = mockResponse()
  await updateTicket({
    method: 'PUT',
    query: { id: 'ticket-1' },
    body: { status }
  }, response)
  return response
}

async function run() {
  currentStatus = 'Open'
  const accepted = await changeStatus('In Progress')
  assert.strictEqual(accepted.statusCode, 200)
  assert.strictEqual(accepted.body.data.status, 'In Progress')
  assert.deepStrictEqual(updatePayload, { status: 'In Progress' })

  currentStatus = 'In Progress'
  const completed = await changeStatus('Completed')
  assert.strictEqual(completed.statusCode, 200)
  assert.strictEqual(completed.body.data.status, 'Completed')
  assert.deepStrictEqual(updatePayload, { status: 'Completed' })

  currentStatus = 'Open'
  const skippedStep = await changeStatus('Completed')
  assert.strictEqual(skippedStep.statusCode, 409)

  const invalid = await changeStatus('Unknown')
  assert.strictEqual(invalid.statusCode, 400)

  currentRole = 'staff'
  const forbidden = await changeStatus('In Progress')
  assert.strictEqual(forbidden.statusCode, 403)

  currentRole = 'admin'
  const methodResponse = mockResponse()
  await updateTicket({ method: 'DELETE', query: { id: 'ticket-1' } }, methodResponse)
  assert.strictEqual(methodResponse.statusCode, 405)
  assert.strictEqual(methodResponse.headers.Allow, 'GET, POST, PUT')

  console.log('Admin ticket acceptance and completion validation passed.')
}

run().catch(error => {
  console.error('Ticket status validation failed:', error.message)
  process.exitCode = 1
})
