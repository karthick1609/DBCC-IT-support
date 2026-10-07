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
    const savedTheme = localStorage.getItem('dbasc_theme') || 'dark'
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
          saveUserSession(result.user)
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

  function saveUserSession(user) {
    const session = {
      email: user.email,
      role: user.role,
      name: user.name,
      authProvider: 'supabase'
    }
    saveSession(session)
    localStorage.setItem('dbasc_role', user.role)
    localStorage.setItem('dbasc_theme', 'dark')
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

      messageBox.classList.add('d-none')
      if (password !== confirmPassword) {
        messageBox.textContent = 'Passwords do not match.'
        messageBox.className = 'alert alert-danger'
        return
      }

      submitButton.disabled = true
      fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: fullName, email: email, password: password })
      })
        .then(async function (response) {
          return readApiResponse(response, 'Create account')
        })
        .then(function (result) {
          if (result.user) {
            saveUserSession(result.user)
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
      if (loginForm) handleLoginSubmit()
      if (registerForm) handleRegisterSubmit()
      setupTheme()
      return
    }

    bindProtectedPages()
  })

  window.DBASCAuth = { getSession, clearSession }
})();
