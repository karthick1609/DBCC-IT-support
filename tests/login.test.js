const fs = require('fs')
const path = require('path')

const loginPath = path.join(__dirname, '..', 'public', 'frontend', 'login.html')

function findHtmlFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const entryPath = path.join(directory, entry.name)
    return entry.isDirectory()
      ? findHtmlFiles(entryPath)
      : entry.isFile() && entry.name.endsWith('.html') ? [entryPath] : []
  })
}

try {
  const html = fs.readFileSync(loginPath, 'utf8')
  const hasLoginForm = html.includes('id="login-form"')
  const hasEmailInput = html.includes('type="email"')
  const hasPasswordInput = html.includes('type="password"')
  const hasRegisterLink = html.includes('/frontend/register.html')
  const hasForgotPassword = html.includes('id="forgot-password-form"') && html.includes('id="show-forgot-password"')
  const hasNoDemoAccounts = !html.includes('Demo accounts')

  if (!hasLoginForm || !hasEmailInput || !hasPasswordInput || !hasRegisterLink || !hasForgotPassword || !hasNoDemoAccounts) {
    throw new Error('Login page is missing required fields, recovery flow, registration link, or demo-account cleanup.')
  }

  const frontendRoot = path.join(__dirname, '..', 'public', 'frontend')
  const frontendPages = findHtmlFiles(frontendRoot)
  const pagesMissingLogo = frontendPages.filter(page => !fs.readFileSync(page, 'utf8').includes('/frontend/assets/js/logo.js'))
  if (pagesMissingLogo.length) {
    throw new Error(`Frontend pages are missing the college logo: ${pagesMissingLogo.map(page => path.relative(frontendRoot, page)).join(', ')}`)
  }
  const logoPath = path.join(frontendRoot, 'assets', 'images', 'college-logo.png')
  if (!fs.existsSync(logoPath)) throw new Error('The college logo image is missing.')

  const registerPath = path.join(__dirname, '..', 'public', 'frontend', 'register.html')
  const registerHtml = fs.readFileSync(registerPath, 'utf8')
  if (!registerHtml.includes('id="register-form"') || !registerHtml.includes('id="full-name"') ||
      !registerHtml.includes('id="confirm-password"') || !registerHtml.includes('id="department"') ||
      !registerHtml.includes('id="role"')) {
    throw new Error('Registration page is missing required fields, department, or role.')
  }

  const authPath = path.join(__dirname, '..', 'public', 'frontend', 'assets', 'js', 'auth.js')
  const authScript = fs.readFileSync(authPath, 'utf8')
  if (!authScript.includes('/api/auth/login') || !authScript.includes('/api/auth/register') || !authScript.includes("authProvider !== 'supabase'") || !authScript.includes('returned an invalid response') || authScript.includes('Admin@123')) {
    throw new Error('Authentication must use the server API and must not contain demo credentials.')
  }

  const usersPath = path.join(__dirname, '..', 'public', 'frontend', 'admin', 'users.html')
  const usersHtml = fs.readFileSync(usersPath, 'utf8')
  if (!usersHtml.includes("authorizedFetch('/api/users')") || usersHtml.includes('mockUsers')) {
    throw new Error('The users page must load actual registered accounts rather than mock users.')
  }

  const assetsHtml = fs.readFileSync(path.join(__dirname, '..', 'public', 'frontend', 'admin', 'assets.html'), 'utf8')
  const ticketsHtml = fs.readFileSync(path.join(__dirname, '..', 'public', 'frontend', 'admin', 'tickets.html'), 'utf8')
  const createAssetHtml = fs.readFileSync(path.join(__dirname, '..', 'public', 'frontend', 'admin', 'add-asset.html'), 'utf8')
  const createTicketHtml = fs.readFileSync(path.join(__dirname, '..', 'public', 'frontend', 'staff', 'create-ticket.html'), 'utf8')
  if (!assetsHtml.includes("authorizedFetch('/api/assets')") || assetsHtml.includes('mockAssets') ||
      !ticketsHtml.includes("authorizedFetch('/api/tickets')") || ticketsHtml.includes('mockTickets') ||
      !createAssetHtml.includes("authorizedFetch('/api/assets'") || createAssetHtml.includes('(mock)') ||
      !createTicketHtml.includes("authorizedFetch('/api/tickets'") || createTicketHtml.includes('(mock)')) {
    throw new Error('Asset and ticket screens must persist and load data through their protected APIs.')
  }

  const apiPaths = ['login.js', 'register.js', 'refresh.js', 'forgot-password.js', 'reset-password.js'].map(file =>
    path.join(__dirname, '..', 'api', 'auth', file)
  )
  apiPaths.push(path.join(__dirname, '..', 'api', 'departments', 'index.js'))
  for (const apiPath of apiPaths) {
    if (!fs.existsSync(apiPath)) throw new Error(`Missing authentication endpoint: ${path.basename(apiPath)}`)
  }
  const resetPage = fs.readFileSync(path.join(__dirname, '..', 'public', 'frontend', 'reset-password.html'), 'utf8')
  if (!resetPage.includes('id="reset-password-form"') || !resetPage.includes('id="new-password"')) {
    throw new Error('The password reset page is missing its update form.')
  }

  const vercelConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'vercel.json'), 'utf8'))
  if (vercelConfig.builds || vercelConfig.routes) {
    throw new Error('Vercel should auto-detect API functions and static files instead of routing API paths to static pages.')
  }

  const reportApi = fs.readFileSync(path.join(__dirname, '..', 'api', 'reports', 'index.js'), 'utf8')
  if (!reportApi.includes("type === 'dashboard-summary'") || !reportApi.includes("['staff', 'admin', 'principal']")) {
    throw new Error('The staff dashboard summary API must be available to authenticated staff.')
  }

  console.log('Login page validation passed.')
} catch (error) {
  console.error('Login page validation failed:', error.message)
  process.exit(1)
}
