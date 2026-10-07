// Shared frontend utilities: dark mode, mock data, role handling
(function(){
  window.Shared = window.Shared || {}
  const ls = window.localStorage
  Shared.role = ls.getItem('dbasc_role') || 'staff'
  Shared.user = null

  Shared.toggleDark = function(enable){
    if(enable){ document.documentElement.classList.add('dark'); ls.setItem('dbasc_dark','1') }
    else { document.documentElement.classList.remove('dark'); ls.removeItem('dbasc_dark') }
  }

  Shared.initTheme = function(){
    const dark = !!ls.getItem('dbasc_dark')
    Shared.toggleDark(dark)
  }

  // Expose to window
  window.Shared = Shared
  document.addEventListener('DOMContentLoaded', ()=>{ Shared.initTheme() })
})()
