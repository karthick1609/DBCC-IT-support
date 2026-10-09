const assert = require('assert')

const supabasePath = require.resolve('../server/supabase')
const authPath = require.resolve('../server/auth')
const departmentCalls = []
let departmentsError = null

const users = [
  { id: 'user-1', full_name: 'Ada Admin', email: 'ada@example.com', role: 'admin', status: 'active', department_id: 'dept-1' },
  { id: 'user-2', full_name: 'Grace Staff', email: 'grace@example.com', role: 'staff', status: 'active', department_id: 'dept-1' },
  { id: 'user-3', full_name: 'Lin User', email: 'lin@example.com', role: 'staff', status: 'active', department_id: null },
  { id: 'user-4', full_name: 'Orphan User', email: 'orphan@example.com', role: 'staff', status: 'active', department_id: 'missing-dept' }
]

function queryFor(table) {
  const query = {
    select(columns) {
      query.columns = columns
      return query
    },
    in(column, values) {
      departmentCalls.push({ table, column, values })
      return query
    },
    then(resolve, reject) {
      const result = table === 'users'
        ? { data: users, error: null }
        : { data: [{ id: 'dept-1', name: 'Computer Science' }], error: departmentsError }
      return Promise.resolve(result).then(resolve, reject)
    }
  }
  return query
}

const supabaseService = {
  from: table => queryFor(table)
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
      assert.deepStrictEqual(roles, ['admin'])
      return { profile: { role: 'admin' } }
    }
  }
}

const listUsers = require('../api/users')

function mockResponse() {
  return {
    statusCode: 200,
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
  const response = mockResponse()
  await listUsers({ method: 'GET' }, response)
  assert.strictEqual(response.statusCode, 200)
  assert.deepStrictEqual(departmentCalls, [{
    table: 'departments',
    column: 'id',
    values: ['dept-1', 'missing-dept']
  }])
  assert.deepStrictEqual(response.body.data.map(profile => profile.department), [
    { name: 'Computer Science' },
    { name: 'Computer Science' },
    null,
    null
  ])

  departmentsError = new Error('Department lookup failed')
  const errorResponse = mockResponse()
  await listUsers({ method: 'GET' }, errorResponse)
  assert.strictEqual(errorResponse.statusCode, 500)
  assert.strictEqual(errorResponse.body.message, 'Department lookup failed')

  console.log('Users department lookup validation passed.')
}

run().catch(error => {
  console.error('Users department lookup validation failed:', error.message)
  process.exitCode = 1
})
