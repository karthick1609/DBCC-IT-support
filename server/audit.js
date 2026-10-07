const { supabaseService } = require('./supabase')

async function logAudit({ user_id, action, module, record_id, old_data, new_data, ip_address, user_agent }){
  try{
    await supabaseService.from('audit_logs').insert([{ user_id, action, module, record_id, old_data, new_data, ip_address, user_agent }])
  }catch(e){ console.warn('Audit log failed', e.message) }
}

module.exports = { logAudit }
