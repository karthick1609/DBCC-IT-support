const assert = require('assert')

const supabasePath = require.resolve('../server/supabase')
let selectedDepartment = { id: 'department-1' }
let createdUser = null
let savedProfile = null
let signUpCalls = 0

const departmentQuery = {
  select: () => departmentQuery,
  eq: () => departmentQuery,
  maybeSingle: async () => ({ data: selectedDepartment, error: null })
}
const supabaseService = {
  from: table => {
    if (table === 'departments') return departmentQuery
    assert.strictEqual(table, 'users')
    return {
      insert: async profile => {
        savedProfile = profile
        return { error: null }
      }
    }
  }
}
const createAuthClient = () => ({
  auth: {
    signUp: async ({ email, password, options }) => {
      signUpCalls += 1
      createdUser = { email, password, options }
      return {
        data: { user: { id: 'auth-user-1' }, session: null },
        error: null
      }
    }
  }
})

require.cache[supabasePath] = {
  id: supabasePath,
  filename: supabasePath,
  loaded: true,
  exports: { supabaseService, createAuthClient }
}

const register = require('../api/auth/register')

function mockResponse() {
  return {
    statusCode: null,
    headers: {},
    body: null,
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
  const invalidDepartmentResponse = mockResponse()
  selectedDepartment = null
  await register({
    method: 'POST',
    body: {
      fullName: 'Example Staff',
      email: 'staff@example.com',
      password: 'valid-password',
      departmentId: 'inactive-department',
      role: 'admin'
    }
  }, invalidDepartmentResponse)
  assert.strictEqual(invalidDepartmentResponse.statusCode, 400)
  assert.strictEqual(signUpCalls, 0)

  const response = mockResponse()
  selectedDepartment = { id: 'department-1' }
  await register({
    method: 'POST',
    body: {
      fullName: 'Example Staff',
      email: ' STAFF@example.com ',
      password: 'valid-password',
      departmentId: 'department-1',
      role: 'admin'
    }
  }, response)
  assert.strictEqual(response.statusCode, 201)
  assert.strictEqual(createdUser.email, 'staff@example.com')
  assert.strictEqual(createdUser.options.data.full_name, 'Example Staff')
  assert.deepStrictEqual(savedProfile, {
    auth_user_id: 'auth-user-1',
    full_name: 'Example Staff',
    email: 'staff@example.com',
    department_id: 'department-1',
    role: 'staff',
    status: 'active'
  })
  assert.strictEqual(response.body.success, true)

  console.log('Staff registration department and role validation passed.')
}

run().catch(error => {
  console.error('Staff registration validation failed:', error.message)
  process.exitCode = 1
})
