const fs = require('fs')
const path = require('path')

const loginPath = path.join(__dirname, '..', 'public', 'frontend', 'login.html')

try {
  const html = fs.readFileSync(loginPath, 'utf8')
  const hasLoginForm = html.includes('id="login-form"')
  const hasEmailInput = html.includes('type="email"')
  const hasPasswordInput = html.includes('type="password"')
  const hasRegisterLink = html.includes('/frontend/register.html')
  const hasNoDemoAccounts = !html.includes('Demo accounts')

  if (!hasLoginForm || !hasEmailInput || !hasPasswordInput || !hasRegisterLink || !hasNoDemoAccounts) {
    throw new Error('Login page is missing required fields, registration link, or demo-account cleanup.')
  }

  const registerPath = path.join(__dirname, '..', 'public', 'frontend', 'register.html')
  const registerHtml = fs.readFileSync(registerPath, 'utf8')
  if (!registerHtml.includes('id="register-form"') || !registerHtml.includes('id="full-name"') || !registerHtml.includes('id="confirm-password"')) {
    throw new Error('Registration page is missing required fields.')
  }

  const authPath = path.join(__dirname, '..', 'public', 'frontend', 'assets', 'js', 'auth.js')
  const authScript = fs.readFileSync(authPath, 'utf8')
  if (!authScript.includes('/api/auth/login') || !authScript.includes('/api/auth/register') || !authScript.includes("authProvider !== 'supabase'") || !authScript.includes('returned an invalid response') || authScript.includes('Admin@123')) {
    throw new Error('Authentication must use the server API and must not contain demo credentials.')
  }

  const usersPath = path.join(__dirname, '..', 'public', 'frontend', 'admin', 'users.html')
  const usersHtml = fs.readFileSync(usersPath, 'utf8')
  if (!usersHtml.includes("fetch('/api/users')") || usersHtml.includes('mockUsers')) {
    throw new Error('The users page must load actual registered accounts rather than mock users.')
  }

  console.log('Login page validation passed.')
} catch (error) {
  console.error('Login page validation failed:', error.message)
  process.exit(1)
}
