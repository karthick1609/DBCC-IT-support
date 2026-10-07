const { supabaseService } = require('./supabase')

async function requireAdmin(req, res) {
  const token = req.headers['authorization'] ? req.headers['authorization'].replace('Bearer ', '') : null
  if (!token) {
    res.status(401).json({ success: false, message: 'Unauthorized' })
    return null
  }
  const { data: user, error } = await supabaseService.auth.getUser(token)
  if (error || !user) {
    res.status(401).json({ success: false, message: 'Invalid token' })
    return null
  }
  // fetch profile to check role
  const { data: profile, error: pErr } = await supabaseService.from('users').select('*').eq('auth_user_id', user.user.id).single()
  if (pErr || !profile) {
    res.status(403).json({ success: false, message: 'Profile not found' })
    return null
  }
  if (profile.role !== 'admin') {
    res.status(403).json({ success: false, message: 'Admin access required' })
    return null
  }
  return profile
}

module.exports = { requireAdmin }
