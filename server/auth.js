const { supabaseService } = require('./supabase')

async function getUserFromRequest(req) {
  const authHeader = req.headers['authorization'] || ''
  const token = authHeader.replace('Bearer ', '')
  if (!token) return null
  const { data, error } = await supabaseService.auth.getUser(token)
  if (error || !data || !data.user) return null
  // find profile in users table by auth_user_id
  const uid = data.user.id
  const { data: profile, error: pErr } = await supabaseService.from('users').select('*').eq('auth_user_id', uid).single()
  if (pErr) return null
  return { auth: data.user, profile }
}

module.exports = { getUserFromRequest }
