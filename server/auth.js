const { supabaseService } = require('./supabase')

async function getUserFromRequest(req) {
  const authHeader = req.headers.authorization || ''
  const match = /^Bearer\s+(.+)$/i.exec(authHeader)
  if (!match) return null
  const token = match[1]
  const { data, error } = await supabaseService.auth.getUser(token)
  if (error || !data.user) return null
  const { data: profile, error: profileError } = await supabaseService
    .from('users')
    .select('id,auth_user_id,full_name,email,role,status,department_id')
    .eq('auth_user_id', data.user.id)
    .maybeSingle()
  if (profileError || !profile || profile.status !== 'active') return null
  return { auth: data.user, profile }
}

async function requireRole(req, res, allowedRoles) {
  const user = await getUserFromRequest(req)
  if (!user) {
    res.status(401).json({ success: false, message: 'Sign in is required.' })
    return null
  }
  if (!allowedRoles.includes(user.profile.role)) {
    res.status(403).json({ success: false, message: 'You do not have permission to perform this action.' })
    return null
  }
  return user
}

module.exports = { getUserFromRequest, requireRole }
