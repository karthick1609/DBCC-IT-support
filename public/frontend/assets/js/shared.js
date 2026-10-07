// Shared frontend utilities: dark mode, mock data, role handling
(function(){
  window.Shared = window.Shared || {}
  const ls = window.localStorage
  Shared.role = ls.getItem('dbasc_role') || 'admin'
  Shared.user = { name: 'Demo User', email: 'staff@example.com' }

  Shared.toggleDark = function(enable){
    if(enable){ document.documentElement.classList.add('dark'); ls.setItem('dbasc_dark','1') }
    else { document.documentElement.classList.remove('dark'); ls.removeItem('dbasc_dark') }
  }

  Shared.initTheme = function(){
    const dark = !!ls.getItem('dbasc_dark')
    Shared.toggleDark(dark)
  }

  Shared.setRole = function(role){ Shared.role = role; ls.setItem('dbasc_role', role); document.querySelectorAll('[data-role]').forEach(el=>{ const allowed = el.getAttribute('data-role').split(','); el.style.display = allowed.includes(role) ? '' : 'none' }) }

  // Mock data
  Shared.mockAssets = (function(){ const arr=[]; for(let i=1;i<=20;i++) arr.push({asset_code:`DB-PC-${String(i).padStart(4,'0')}`,asset_name:`Desktop ${i}`,category:'Desktop PC',brand:'Dell',model:'OptiPlex',serial:`SN${1000+i}`,location:'Lab 1',assigned_user:'',status:'Active',warranty:'2025-12-31'}); return arr })()
  Shared.mockTickets = (function(){ const arr=[]; for(let i=1;i<=15;i++) arr.push({ticket_number:`DB-HD-${String(i).padStart(6,'0')}`,title:`Issue ${i}`,requester:`Staff ${i}`,department:'BCA',category:'Network',priority:['Low','Medium','High','Critical'][i%4],status:['Open','Assigned','In Progress','Resolved'][i%4],assigned_to:'Tech 1',created_at:'2026-10-0'+(i%9+1)}); return arr })()
  Shared.mockUsers = (function(){ const arr=[]; for(let i=1;i<=10;i++) arr.push({full_name:`User ${i}`,email:`user${i}@example.com`,department:['BCA','B.Com','Viscom'][i%3],role:['staff','admin','principal'][i%3],status:'active'}); return arr })()

  // Expose to window
  window.Shared = Shared
  document.addEventListener('DOMContentLoaded', ()=>{ Shared.initTheme(); if(document.getElementById('role-selector')) document.getElementById('role-selector').addEventListener('change', e=>Shared.setRole(e.target.value)) })
})()
