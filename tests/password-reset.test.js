const assert = require('assert')

const supabasePath = require.resolve('../server/supabase')
let resetEmailError = null
let sessionError = null
let updateError = null
let resetEmailArguments = null
let sessionArguments = null
let passwordUpdate = null

const auth = {
  resetPasswordForEmail: async (...args) => {
    resetEmailArguments = args
    return { error: resetEmailError }
  },
  setSession: async args => {
    sessionArguments = args
    return { data: { user: { id: 'user-1' } }, error: sessionError }
  },
  updateUser: async args => {
    passwordUpdate = args
    return { error: updateError }
  }
}

require.cache[supabasePath] = {
  id: supabasePath,
  filename: supabasePath,
  loaded: true,
  exports: { createAuthClient: () => ({ auth }) }
}

const requestReset = require('../api/auth/forgot-password')
const resetPassword = require('../api/auth/reset-password')

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
  const invalidEmailResponse = mockResponse()
  await requestReset({ method: 'POST', body: { email: 'not-an-email' } }, invalidEmailResponse)
  assert.strictEqual(invalidEmailResponse.statusCode, 400)
  assert.strictEqual(resetEmailArguments, null)

  const forgotResponse = mockResponse()
  await requestReset({ method: 'POST', body: { email: ' User@Example.com ' } }, forgotResponse)
  assert.strictEqual(forgotResponse.statusCode, 200)
  assert.strictEqual(resetEmailArguments[0], 'user@example.com')
  assert.strictEqual(new URL(resetEmailArguments[1].redirectTo).pathname, '/frontend/reset-password.html')

  const unsupportedMethodResponse = mockResponse()
  await resetPassword({ method: 'GET' }, unsupportedMethodResponse)
  assert.strictEqual(unsupportedMethodResponse.statusCode, 405)
  assert.strictEqual(unsupportedMethodResponse.headers.Allow, 'POST')

  const shortPasswordResponse = mockResponse()
  await resetPassword({
    method: 'POST',
    body: { access_token: 'access', refresh_token: 'refresh', password: 'short' }
  }, shortPasswordResponse)
  assert.strictEqual(shortPasswordResponse.statusCode, 400)
  assert.strictEqual(sessionArguments, null)

  const resetResponse = mockResponse()
  await resetPassword({
    method: 'POST',
    body: { access_token: 'access', refresh_token: 'refresh', password: 'long-enough-password' }
  }, resetResponse)
  assert.strictEqual(resetResponse.statusCode, 200)
  assert.deepStrictEqual(sessionArguments, { access_token: 'access', refresh_token: 'refresh' })
  assert.deepStrictEqual(passwordUpdate, { password: 'long-enough-password' })

  sessionError = new Error('expired token')
  const expiredResponse = mockResponse()
  await resetPassword({
    method: 'POST',
    body: { access_token: 'expired', refresh_token: 'expired', password: 'long-enough-password' }
  }, expiredResponse)
  assert.strictEqual(expiredResponse.statusCode, 400)

  console.log('Password reset validation passed.')
}

run().catch(error => {
  console.error('Password reset validation failed:', error.message)
  process.exitCode = 1
})
