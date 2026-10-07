// Frontend app helpers and mock data loader
const App = {
  role: localStorage.getItem('dbasc_role') || 'staff',
  user: null,
}

function setRole(role){ App.role = role; localStorage.setItem('dbasc_role', role); renderNav(); }

function renderNav(){
  const role = App.role
  document.querySelectorAll('[data-role]').forEach(el=>{
    const allowed = el.getAttribute('data-role').split(',')
    el.style.display = allowed.includes(role) ? '' : 'none'
  })
  document.getElementById('nav-role').textContent = role.toUpperCase()
}

window.App = App
window.setRole = setRole
document.addEventListener('DOMContentLoaded', ()=>{ if(document.getElementById('nav-role')) renderNav() })
