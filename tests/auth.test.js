const assert = require('assert')

const supabasePath = require.resolve('../server/supabase')
let authResult = { data: { user: { id: 'auth-1' } }, error: null }
let profileResult = {
  data: { id: 'profile-1', auth_user_id: 'auth-1', role: 'staff', status: 'active' },
  error: null
}

const supabaseService = {
  auth: {
    getUser: async token => {
      assert.strictEqual(token, 'valid-token')
      return authResult
    }
  },
  from: table => {
    assert.strictEqual(table, 'users')
    const query = {
      select: () => query,
      eq: (field, value) => {
          assert.strictEqual(field, 'auth_user_id')
          assert.strictEqual(value, 'auth-1')
          return query
      },
      maybeSingle: async () => profileResult
    }
    return query
  }
}

require.cache[supabasePath] = {
  id: supabasePath,
  filename: supabasePath,
  loaded: true,
  exports: { supabaseService }
}

const { getUserFromRequest, requireRole } = require('../server/auth')

function mockResponse() {
  return {
    statusCode: null,
    body: null,
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
  const accepted = await getUserFromRequest({ headers: { authorization: 'Bearer valid-token' } })
  assert.strictEqual(accepted.profile.role, 'staff')
  assert.strictEqual(await getUserFromRequest({ headers: { authorization: 'Basic valid-token' } }), null)

  profileResult = { data: { id: 'profile-1', role: 'staff', status: 'disabled' }, error: null }
  assert.strictEqual(await getUserFromRequest({ headers: { authorization: 'Bearer valid-token' } }), null)
  profileResult = { data: { id: 'profile-1', role: 'staff', status: 'active' }, error: null }

  const forbiddenResponse = mockResponse()
  const forbidden = await requireRole(
    { headers: { authorization: 'Bearer valid-token' } },
    forbiddenResponse,
    ['admin']
  )
  assert.strictEqual(forbidden, null)
  assert.strictEqual(forbiddenResponse.statusCode, 403)

  const missingResponse = mockResponse()
  const missing = await requireRole({ headers: {} }, missingResponse, ['admin'])
  assert.strictEqual(missing, null)
  assert.strictEqual(missingResponse.statusCode, 401)

  console.log('Authorization validation passed.')
}

run().catch(error => {
  console.error('Authorization validation failed:', error.message)
  process.exitCode = 1
})
