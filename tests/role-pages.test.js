const assert = require('assert')
const fs = require('fs')
const path = require('path')
const vm = require('vm')

const root = path.join(__dirname, '..', 'public', 'frontend')
const authScript = fs.readFileSync(path.join(root, 'assets', 'js', 'auth.js'), 'utf8')

function renderNavigation(role) {
  const session = {
    authProvider: 'supabase',
    name: 'Test User',
    role,
    accessToken: 'test-token',
    expiresAt: Math.floor(Date.now() / 1000) + 3600
  }
  const storage = new Map([['dbasc_session', JSON.stringify(session)]])
  const sidebar = {
    children: [],
    replaceChildren(...children) {
      this.children = children
    }
  }
  const createElement = tagName => ({
    tagName,
    children: [],
    attributes: {},
    classList: { add() {} },
    setAttribute(name, value) {
      this.attributes[name] = value
    },
    append(...children) {
      this.children.push(...children)
    }
  })
  let readyCallback
  const document = {
    body: { classList: { toggle() {} } },
    addEventListener(event, callback) {
      if (event === 'DOMContentLoaded') readyCallback = callback
    },
    createElement,
    createTextNode(text) {
      return { textContent: text }
    },
    getElementById() {
      return null
    },
    querySelector(selector) {
      return selector === '.sidebar' ? sidebar : null
    }
  }
  const localStorage = {
    getItem(key) {
      return storage.get(key) || null
    },
    setItem(key, value) {
      storage.set(key, value)
    },
    removeItem(key) {
      storage.delete(key)
    }
  }
  const dashboards = {
    admin: '/frontend/admin/dashboard.html',
    staff: '/frontend/staff/dashboard.html',
    principal: '/frontend/principal/dashboard.html'
  }
  const window = { location: { pathname: dashboards[role] } }
  window.location.replace = url => {
    window.location.redirectedTo = url
  }

  vm.runInNewContext(authScript, { document, localStorage, window, fetch() {} })
  assert.strictEqual(typeof readyCallback, 'function', 'auth script should register its page initializer')
  readyCallback()

  const list = sidebar.children[1]
  return list.children.map(entry => {
    const link = entry.children[0]
    return {
      label: link.children[1].textContent,
      href: link.href,
      active: Boolean(link.attributes['aria-current'])
    }
  })
}

function getRedirect(role, pathname) {
  const session = role
    ? { authProvider: 'supabase', name: 'Test User', role, accessToken: 'test-token', expiresAt: Math.floor(Date.now() / 1000) + 3600 }
    : null
  const storage = new Map()
  if (session) storage.set('dbasc_session', JSON.stringify(session))
  const document = {
    body: { classList: { toggle() {} } },
    addEventListener() {},
    getElementById() {
      return null
    },
    querySelector() {
      return null
    }
  }
  const window = { location: { pathname, replace(url) { this.redirectedTo = url } } }
  const localStorage = {
    getItem(key) {
      return storage.get(key) || null
    },
    removeItem(key) {
      storage.delete(key)
    }
  }
  vm.runInNewContext(authScript, { document, localStorage, window, fetch() {} })
  return window.location.redirectedTo || null
}

try {
  const menus = {
    admin: renderNavigation('admin'),
    staff: renderNavigation('staff'),
    principal: renderNavigation('principal')
  }
  const labels = role => menus[role].map(item => item.label)

  for (const [role, expected] of Object.entries({
    admin: ['Dashboard', 'Assets', 'Add/Edit Asset', 'Tickets', 'Users', 'Departments', 'Locations', 'Reports', 'Audit Logs', 'Settings'],
    staff: ['Dashboard', 'Create Ticket', 'My Tickets', 'Assets overview', 'Profile'],
    principal: ['Dashboard', 'Asset Overview', 'Ticket Overview', 'Reports', 'Profile']
  })) {
    assert.deepStrictEqual(labels(role), expected, `${role} menu should match the page list`)
    for (const item of menus[role]) {
      const localPath = item.href.replace('/frontend/', '')
      if (localPath.startsWith('admin/') || localPath.startsWith('staff/') || localPath.startsWith('principal/')) {
        assert.ok(fs.existsSync(path.join(root, localPath)), `${role} navigation target should exist: ${item.href}`)
      }
    }
  }

  for (const [role, forbiddenPath] of [
    ['staff', '/frontend/admin/users.html'],
    ['staff', '/frontend/admin/settings.html'],
    ['principal', '/frontend/admin/add-asset.html'],
    ['principal', '/frontend/staff/create-ticket.html'],
    ['admin', '/frontend/staff/profile.html'],
    ['admin', '/frontend/principal/profile.html']
  ]) {
    assert.strictEqual(getRedirect(role, forbiddenPath), '/frontend/error-403.html', `${role} should not access ${forbiddenPath}`)
  }
  assert.strictEqual(getRedirect(null, '/frontend/admin/dashboard.html'), '/frontend/login.html', 'protected pages should require a session')
  assert.strictEqual(getRedirect('staff', '/frontend/index.html'), '/frontend/staff/dashboard.html', 'home should open the current role dashboard')
  assert.strictEqual(getRedirect('principal', '/frontend/admin/reports.html'), null, 'reports should be shared with principals')

  const commonPages = [
    'login.html',
    'forgot-password.html',
    'error-403.html',
    'error-404.html',
    'error-500.html'
  ]
  for (const page of commonPages) {
    const html = fs.readFileSync(path.join(root, page), 'utf8')
    assert.ok(html.includes('/frontend/assets/js/logo.js'), `${page} should include the shared college logo`)
  }

  console.log('Role-based page navigation validation passed.')
} catch (error) {
  console.error('Role-based page navigation validation failed:', error.message)
  process.exit(1)
}
