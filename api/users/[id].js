const { supabaseService } = require('../../server/supabase')
const { getUserFromRequest } = require('../../server/auth')

module.exports = async (req, res) => {
  const { id } = req.query
  if (!id) return res.status(400).json({ success: false, message: 'User id required' })
  const me = await getUserFromRequest(req)
  if (!me) return res.status(401).json({ success: false, message: 'Unauthorized' })

  if (req.method === 'GET') {
    if (me.profile.role !== 'admin' && me.profile.id !== id) {
      return res.status(403).json({ success: false, message: 'You may only view your own account.' })
    }
    try {
      const { data, error } = await supabaseService.from('users').select('*').eq('id', id).single()
      if (error) throw error
      res.json({ success: true, data })
    } catch (err) { res.status(500).json({ success: false, message: err.message }) }
  } else if (req.method === 'PUT') {
    if (me.profile.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin required' })
    try {
      const body = req.body || {}
      const payload = {}
      for (const field of ['full_name', 'email', 'phone', 'department_id', 'role', 'status']) {
        if (Object.prototype.hasOwnProperty.call(body, field)) payload[field] = body[field]
      }
      if (payload.role && !['staff', 'admin', 'principal'].includes(payload.role)) {
        return res.status(400).json({ success: false, message: 'Invalid user role.' })
      }
      if (Object.keys(payload).length === 0) {
        return res.status(400).json({ success: false, message: 'No supported profile fields provided.' })
      }
      const { data, error } = await supabaseService.from('users').update(payload).eq('id', id).select().single()
      if (error) throw error
      res.json({ success: true, data })
    } catch (err) { res.status(500).json({ success: false, message: err.message }) }
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed' })
  }
}
