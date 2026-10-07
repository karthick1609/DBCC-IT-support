const { supabaseService } = require('../../server/supabase')

module.exports = async (req, res) => {
  if (req.method === 'GET') {
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
    res.status(405).json({ success: false, message: 'Method not allowed' })
  }
}
