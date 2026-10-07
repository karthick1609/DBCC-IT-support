const fs = require('fs')
const path = require('path')

const loginPath = path.join(__dirname, '..', 'public', 'frontend', 'login.html')

try {
  const html = fs.readFileSync(loginPath, 'utf8')
  const hasLoginForm = html.includes('id="login-form"')
  const hasEmailInput = html.includes('type="email"')
  const hasPasswordInput = html.includes('type="password"')

  if (!hasLoginForm || !hasEmailInput || !hasPasswordInput) {
    throw new Error('Login page is missing required login form fields.')
  }

  console.log('Login page validation passed.')
} catch (error) {
  console.error('Login page validation failed:', error.message)
  process.exit(1)
}
