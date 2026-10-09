(function () {
  const AUTH_KEY = 'dbasc_session'

  function getSession() {
    try {
      const data = localStorage.getItem(AUTH_KEY)
      if (!data) return null
      const session = JSON.parse(data)
      if (session.authProvider !== 'supabase') {
        clearSession()
        return null
      }
      return session
    } catch (error) {
      return null
    }
  }

  function saveSession(user) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(user))
  }

  async function refreshSession() {
    const current = getSession()
    if (!current || !current.refreshToken) {
      clearSession()
      throw new Error('Your session has expired. Please sign in again.')
    }

    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: current.refreshToken })
    })
    const result = await readApiResponse(response, 'Refresh session')
    saveSession(Object.assign({}, current, {
      accessToken: result.session.access_token,
      refreshToken: result.session.refresh_token,
      expiresAt: result.session.expires_at
    }))
  }

  async function authorizedFetch(url, options) {
    let session = getSession()
    if (!session) throw new Error('Sign in is required.')
    if (!session.accessToken || !session.expiresAt || session.expiresAt * 1000 < Date.now() + 60000) {
      await refreshSession()
      session = getSession()
    }
    const requestOptions = Object.assign({}, options || {})
    const headers = Object.assign({}, requestOptions.headers || {})
    headers.Authorization = 'Bearer ' + session.accessToken
    requestOptions.headers = headers
    return fetch(url, requestOptions)
  }

  function clearSession() {
    localStorage.removeItem(AUTH_KEY)
    localStorage.removeItem('dbasc_role')
    localStorage.removeItem('dbasc_theme')
  }

  function applyTheme(theme) {
    const isDark = theme === 'dark'
    document.body.classList.toggle('dark', isDark)

    const themeToggle = document.getElementById('theme-toggle')
    if (themeToggle) {
      const icon = isDark ? '<i class="bi bi-sun"></i> Light' : '<i class="bi bi-moon-stars"></i> Dark'
      themeToggle.innerHTML = icon
    }
  }

  function setupTheme() {
    const themeVersion = 'network-theme-6'
    if (localStorage.getItem('dbasc_theme_version') !== themeVersion) {
      localStorage.setItem('dbasc_theme', 'light')
      localStorage.setItem('dbasc_theme_version', themeVersion)
    }
    const savedTheme = localStorage.getItem('dbasc_theme') || 'light'
    applyTheme(savedTheme)

    const toggle = document.getElementById('theme-toggle')
    if (!toggle) return

    toggle.addEventListener('click', function () {
      const nextTheme = document.body.classList.contains('dark') ? 'light' : 'dark'
      localStorage.setItem('dbasc_theme', nextTheme)
      applyTheme(nextTheme)
    })
  }

  function redirectToLogin() {
    window.location.href = '/frontend/login.html'
  }

  function renderRoleNavigation(session) {
    const sidebar = document.querySelector('.sidebar')
    if (!sidebar) return

    const dashboards = {
      admin: '/frontend/admin/dashboard.html',
      staff: '/frontend/staff/dashboard.html',
      principal: '/frontend/principal/dashboard.html'
    }
    const common = [
      { label: 'Dashboard', href: dashboards[session.role], icon: 'speedometer2' }
    ]
    const navigation = {
      admin: [
        ...common,
        { label: 'Assets', href: '/frontend/admin/assets.html', icon: 'pc-display' },
        { label: 'Add/Edit Asset', href: '/frontend/admin/add-asset.html', icon: 'pc' },
        { label: 'Tickets', href: '/frontend/admin/tickets.html', icon: 'ticket-detailed' },
        { label: 'Users', href: '/frontend/admin/users.html', icon: 'people' },
        { label: 'Departments', href: '/frontend/admin/departments.html', icon: 'diagram-3' },
        { label: 'Locations', href: '/frontend/admin/locations.html', icon: 'geo-alt' },
        { label: 'Reports', href: '/frontend/admin/reports.html', icon: 'graph-up-arrow' },
        { label: 'Audit Logs', href: '/frontend/admin/audit-logs.html', icon: 'journal-text' },
        { label: 'Settings', href: '/frontend/admin/settings.html', icon: 'gear' }
      ],
      staff: [
        ...common,
        { label: 'Create Ticket', href: '/frontend/staff/create-ticket.html', icon: 'plus-circle' },
        { label: 'My Tickets', href: '/frontend/admin/tickets.html', icon: 'ticket-detailed' },
        { label: 'Assets', href: '/frontend/admin/assets.html', icon: 'pc-display' },
        { label: 'Profile', href: '/frontend/staff/profile.html', icon: 'person' }
      ],
      principal: [
        ...common,
        { label: 'Asset Overview', href: '/frontend/principal/asset-overview.html', icon: 'pc-display' },
        { label: 'Ticket Overview', href: '/frontend/principal/ticket-overview.html', icon: 'ticket-detailed' },
        { label: 'Reports', href: '/frontend/admin/reports.html', icon: 'graph-up-arrow' },
        { label: 'Profile', href: '/frontend/principal/profile.html', icon: 'person' }
      ]
    }

    const header = document.createElement('div')
    header.className = 'sidebar-header'
    const heading = document.createElement('h6')
    heading.textContent = 'Menu'
    header.append(heading)

    const list = document.createElement('ul')
    list.className = 'nav flex-column'
    const currentPath = window.location.pathname
    ;(navigation[session.role] || []).forEach(item => {
      const entry = document.createElement('li')
      entry.className = 'nav-item'
      const link = document.createElement('a')
      link.className = 'nav-link'
      link.href = item.href
      if (currentPath === item.href) {
        link.classList.add('active')
        link.setAttribute('aria-current', 'page')
      }
      const icon = document.createElement('i')
      icon.className = `bi bi-${item.icon}`
      icon.setAttribute('aria-hidden', 'true')
      link.append(icon, document.createTextNode(item.label))
      entry.append(link)
      list.append(entry)
    })
    sidebar.replaceChildren(header, list)
  }

  function setupProtectedTopbar(session) {
    const topbar = document.querySelector('.topbar')
    if (!topbar || topbar.querySelector('#logout-button')) return

    const topbarContent = topbar.querySelector('.container-fluid') || topbar
    topbarContent.classList.add('justify-content-between')
    const controls = document.createElement('div')
    controls.className = 'topbar-right'

    const welcome = document.createElement('div')
    welcome.className = 'user-pill'
    welcome.id = 'welcome-user'
    const dot = document.createElement('span')
    dot.className = 'user-dot'
    welcome.append(dot, document.createTextNode(` ${session.name}`))

    const role = document.createElement('div')
    role.className = 'user-pill'
    role.append(document.createTextNode('Role: '))
    const roleName = document.createElement('strong')
    roleName.id = 'nav-role'
    roleName.textContent = session.role.toUpperCase()
    role.append(roleName)

    const theme = document.createElement('button')
    theme.className = 'theme-toggle'
    theme.id = 'theme-toggle'
    theme.type = 'button'

    const logout = document.createElement('button')
    logout.className = 'logout-btn'
    logout.id = 'logout-button'
    logout.type = 'button'
    logout.innerHTML = '<i class="bi bi-box-arrow-right" aria-hidden="true"></i> Logout'
    controls.append(welcome, role, theme, logout)
    topbarContent.append(controls)
  }

  async function readApiResponse(response, action) {
    let result
    try {
      result = await response.json()
    } catch (error) {
      throw new Error(`${action} service returned an invalid response (HTTP ${response.status}). Check that Vercel deployed the latest commit and that the /api/auth route is available.`)
    }
    if (!response.ok) throw new Error(result.message || `Unable to ${action.toLowerCase()}.`)
    return result
  }

  function handleLoginSubmit() {
    const form = document.getElementById('login-form')
    if (!form) return

    form.addEventListener('submit', function (event) {
      event.preventDefault()

      const email = document.getElementById('email').value.trim().toLowerCase()
      const password = document.getElementById('password').value
      const errorBox = document.getElementById('login-error')
      const submitButton = form.querySelector('[type="submit"]')
      errorBox.classList.add('d-none')
      submitButton.disabled = true

      fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: password })
      })
        .then(async function (response) {
          return readApiResponse(response, 'Sign in')
        })
        .then(function (result) {
          saveUserSession(result.user, result.session)
        })
        .catch(function (error) {
          errorBox.textContent = error.message
          errorBox.classList.remove('d-none')
        })
        .finally(function () {
          submitButton.disabled = false
        })
    })
  }

  function handleForgotPassword() {
    const loginForm = document.getElementById('login-form')
    const recoveryForm = document.getElementById('forgot-password-form')
    const showRecovery = document.getElementById('show-forgot-password')
    const backToLogin = document.getElementById('back-to-login')
    if (!loginForm || !recoveryForm || !showRecovery || !backToLogin) return

    const emailInput = document.getElementById('email')
    const recoveryEmail = document.getElementById('recovery-email')
    const messageBox = document.getElementById('recovery-message')

    function openRecovery() {
      recoveryEmail.value = emailInput.value.trim()
      loginForm.classList.add('d-none')
      showRecovery.classList.add('d-none')
      recoveryForm.classList.remove('d-none')
      document.getElementById('login-error').classList.add('d-none')
      recoveryEmail.focus()
    }

    showRecovery.addEventListener('click', openRecovery)
    if (window.location.hash === '#forgot-password') openRecovery()

    backToLogin.addEventListener('click', function () {
      recoveryForm.classList.add('d-none')
      showRecovery.classList.remove('d-none')
      loginForm.classList.remove('d-none')
      messageBox.classList.add('d-none')
    })

    recoveryForm.addEventListener('submit', async function (event) {
      event.preventDefault()
      const submitButton = recoveryForm.querySelector('[type="submit"]')
      submitButton.disabled = true
      messageBox.className = 'alert d-none'

      try {
        const response = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: recoveryEmail.value.trim().toLowerCase() })
        })
        await readApiResponse(response, 'Request password reset')
        messageBox.textContent = 'If an account exists for that email, a password reset link will be sent shortly.'
        messageBox.className = 'alert alert-success'
      } catch (error) {
        messageBox.textContent = error.message
        messageBox.className = 'alert alert-danger'
      } finally {
        submitButton.disabled = false
      }
    })
  }

  function handleResetPassword() {
    const form = document.getElementById('reset-password-form')
    if (!form) return

    const messageBox = document.getElementById('reset-password-message')
    const hash = new URLSearchParams(window.location.hash.slice(1))
    const accessToken = hash.get('access_token')
    const refreshToken = hash.get('refresh_token')
    const recovery = hash.get('type') === 'recovery'
    const submitButton = form.querySelector('[type="submit"]')

    if (!accessToken || !refreshToken || !recovery) {
      messageBox.textContent = 'This reset link is invalid or has expired. Request a new one from the login page.'
      messageBox.className = 'alert alert-danger'
      submitButton.disabled = true
      return
    }

    form.addEventListener('submit', async function (event) {
      event.preventDefault()
      const password = document.getElementById('new-password').value
      const confirmPassword = document.getElementById('confirm-new-password').value
      messageBox.className = 'alert d-none'

      if (password !== confirmPassword) {
        messageBox.textContent = 'Passwords do not match.'
        messageBox.className = 'alert alert-danger'
        return
      }

      submitButton.disabled = true
      try {
        const response = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            access_token: accessToken,
            refresh_token: refreshToken,
            password
          })
        })
        await readApiResponse(response, 'Reset password')
        history.replaceState(null, '', window.location.pathname)
        messageBox.textContent = 'Your password has been updated. You can now sign in.'
        messageBox.className = 'alert alert-success'
        form.reset()
        submitButton.classList.add('d-none')
      } catch (error) {
        messageBox.textContent = error.message
        messageBox.className = 'alert alert-danger'
      } finally {
        submitButton.disabled = false
      }
    })
  }

  function saveUserSession(user, authSession) {
    if (!authSession || !authSession.access_token || !authSession.refresh_token) {
      throw new Error('Sign-in did not return a valid session. Check Supabase Auth configuration.')
    }
    const userSession = {
      email: user.email,
      role: user.role,
      name: user.name,
      authProvider: 'supabase',
      accessToken: authSession.access_token,
      refreshToken: authSession.refresh_token,
      expiresAt: authSession.expires_at
    }
    saveSession(userSession)
    localStorage.setItem('dbasc_role', user.role)
    localStorage.setItem('dbasc_theme', 'light')
    window.location.href = '/frontend/index.html'
  }

  function handleRegisterSubmit() {
    const form = document.getElementById('register-form')
    if (!form) return

    form.addEventListener('submit', function (event) {
      event.preventDefault()
      const messageBox = document.getElementById('register-message')
      const submitButton = form.querySelector('[type="submit"]')
      const fullName = document.getElementById('full-name').value.trim()
      const email = document.getElementById('email').value.trim().toLowerCase()
      const password = document.getElementById('password').value
      const confirmPassword = document.getElementById('confirm-password').value
      const departmentId = document.getElementById('department').value

      messageBox.classList.add('d-none')
      if (!departmentId) {
        messageBox.textContent = 'Select your department.'
        messageBox.className = 'alert alert-danger'
        return
      }
      if (password !== confirmPassword) {
        messageBox.textContent = 'Passwords do not match.'
        messageBox.className = 'alert alert-danger'
        return
      }

      submitButton.disabled = true
      fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: fullName, email: email, password: password, departmentId: departmentId })
      })
        .then(async function (response) {
          return readApiResponse(response, 'Create account')
        })
        .then(function (result) {
          if (result.user) {
            saveUserSession(result.user, result.session)
            return
          }
          messageBox.textContent = 'Account created. Check your email for a confirmation link, then sign in.'
          messageBox.className = 'alert alert-success'
          form.reset()
        })
        .catch(function (error) {
          messageBox.textContent = error.message
          messageBox.className = 'alert alert-danger'
        })
        .finally(function () {
          submitButton.disabled = false
        })
    })
  }

  async function loadRegistrationDepartments() {
    const departmentSelect = document.getElementById('department')
    if (!departmentSelect) return

    const form = document.getElementById('register-form')
    const submitButton = form.querySelector('[type="submit"]')
    const messageBox = document.getElementById('register-message')

    try {
      const response = await fetch('/api/departments')
      const result = await readApiResponse(response, 'Load departments')
      const departments = Array.isArray(result.data) ? result.data : []
      if (!departments.length) throw new Error('No active departments are available. Please contact an administrator.')

      departmentSelect.replaceChildren(new Option('Select department', ''))
      departments.forEach(department => {
        departmentSelect.add(new Option(department.name, department.id))
      })
      departmentSelect.disabled = false
      submitButton.disabled = false
    } catch (error) {
      departmentSelect.replaceChildren(new Option('Departments unavailable', ''))
      messageBox.textContent = error.message
      messageBox.className = 'alert alert-danger'
      submitButton.disabled = true
    }
  }

  function bindProtectedPages() {
    const session = getSession()
    if (!session) {
      redirectToLogin()
      return
    }

    const userLabel = document.getElementById('welcome-user')
    const roleText = document.getElementById('nav-role')
    if (userLabel) {
      const dot = document.createElement('span')
      dot.className = 'user-dot'
      userLabel.replaceChildren(dot, document.createTextNode(` ${session.name}`))
    }
    if (roleText) roleText.textContent = session.role.toUpperCase()
    renderRoleNavigation(session)
    setupProtectedTopbar(session)

    const logoutButton = document.getElementById('logout-button')
    if (logoutButton) {
      logoutButton.addEventListener('click', function () {
        clearSession()
        redirectToLogin()
      })
    }

    setupTheme()
  }

  document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('login-form')
    const registerForm = document.getElementById('register-form')
    if (loginForm || registerForm) {
      const session = getSession()
      if (session) {
        window.location.href = '/frontend/index.html'
        return
      }
      if (loginForm) {
        handleLoginSubmit()
        handleForgotPassword()
      }
      if (registerForm) {
        handleRegisterSubmit()
        loadRegistrationDepartments()
      }
      setupTheme()
      return
    }

    if (document.getElementById('reset-password-form')) {
      handleResetPassword()
      return
    }

    bindProtectedPages()
  })

  window.DBASCAuth = { getSession, clearSession, authorizedFetch }
})();
