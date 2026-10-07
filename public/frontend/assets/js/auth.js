(function () {
  const AUTH_KEY = 'dbasc_session'
  const USERS = {
    'admin@example.com': { password: 'Admin@123', role: 'admin', name: 'Admin User' },
    'staff@example.com': { password: 'Staff@123', role: 'staff', name: 'Staff User' },
    'principal@example.com': { password: 'Principal@123', role: 'principal', name: 'Principal User' }
  }

  function getSession() {
    try {
      const data = localStorage.getItem(AUTH_KEY)
      return data ? JSON.parse(data) : null
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

  function handleLoginSubmit() {
    const form = document.getElementById('login-form')
    if (!form) return

    form.addEventListener('submit', function (event) {
      event.preventDefault()

      const email = document.getElementById('email').value.trim().toLowerCase()
      const password = document.getElementById('password').value
      const user = USERS[email]
      const errorBox = document.getElementById('login-error')

      if (!user || user.password !== password) {
        errorBox.textContent = 'Invalid email or password.'
        errorBox.classList.remove('d-none')
        return
      }

      const session = {
        email: email,
        role: user.role,
        name: user.name
      }

      saveSession(session)
      localStorage.setItem('dbasc_role', user.role)
      localStorage.setItem('dbasc_theme', 'dark')
      window.location.href = '/frontend/index.html'
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
    if (userLabel) userLabel.innerHTML = `<span class="user-dot"></span> ${session.name}`
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
    if (loginForm) {
      const session = getSession()
      if (session) {
        window.location.href = '/frontend/index.html'
        return
      }
      handleLoginSubmit()
      setupTheme()
      return
    }

    bindProtectedPages()
  })

  window.DBASCAuth = {
    getSession,
    saveSession,
    clearSession,
    USERS
  }
})();
