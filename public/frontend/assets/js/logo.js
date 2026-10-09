(function () {
  function addCollegeLogo() {
    if (document.querySelector('.college-logo')) return

    const logo = document.createElement('img')
    logo.className = 'college-logo'
    logo.src = '/frontend/assets/images/college-logo.png'
    logo.alt = 'Don Bosco Arts and Science College'
    logo.width = 64
    logo.height = 64
    logo.decoding = 'async'

    const header = document.querySelector('.topbar')
    const authShell = document.querySelector('.auth-login-shell, .auth-shell')
    if (header) {
      logo.classList.add('college-logo-topbar')
      header.append(logo)
    } else if (authShell) {
      logo.classList.add('college-logo-auth')
      authShell.prepend(logo)
    } else {
      logo.classList.add('college-logo-page')
      document.body.prepend(logo)
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addCollegeLogo, { once: true })
  } else {
    addCollegeLogo()
  }
})()
