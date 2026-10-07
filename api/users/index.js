const { supabaseService } = require('../../server/supabase')
const { requireRole } = require('../../server/auth')

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    const user = await requireRole(req, res, ['admin'])
    if (!user) return
    try {
      const { data, error } = await supabaseService
        .from('users')
        .select('id,full_name,email,role,status,department:departments(name)')
      if (error) throw error
      res.json({ success: true, data })
    } catch (err) {
      res.status(500).json({ success: false, message: err.message })
    }
  } else {
    res.setHeader('Allow', 'GET')
    res.status(405).json({ success: false, message: 'Method not allowed' })
  }
}
