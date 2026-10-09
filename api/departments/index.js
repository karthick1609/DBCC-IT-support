const { supabaseService } = require('../../server/supabase')

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  try {
    const { data, error } = await supabaseService
      .from('departments')
      .select('id,name')
      .eq('status', 'active')
      .order('name', { ascending: true })
    if (error) throw error
    return res.status(200).json({ success: true, data })
  } catch (error) {
    console.error('Failed to load departments for registration:', error.message)
    return res.status(500).json({ success: false, message: 'Unable to load departments right now.' })
  }
}
