// Minimal JS for navigation and API helpers
async function apiGet(path, params = {}) {
  const url = new URL(path, window.location.origin)
  Object.keys(params).forEach(k => url.searchParams.append(k, params[k]))
  const res = await fetch(url)
  return res.json()
}

async function apiPost(path, body) {
  const res = await fetch(path, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) })
  return res.json()
}

window.apiGet = apiGet
window.apiPost = apiPost
