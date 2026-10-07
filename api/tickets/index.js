const { createClient } = require('@supabase/supabase-js')
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    const { page = 1, per_page = 20 } = req.query
    const offset = (page - 1) * per_page
    try {
      const { data, error } = await supabase.from('tickets').select('*').order('created_at', { ascending: false }).range(offset, offset + Number(per_page) - 1)
      if (error) throw error
      res.json({ success: true, data })
    } catch (err) {
      res.status(500).json({ success: false, message: err.message })
    }
  } else if (req.method === 'POST') {
    try {
      const payload = req.body
      const { data, error } = await supabase.from('tickets').insert([payload])
      if (error) throw error
      res.status(201).json({ success: true, data: data[0] })
    } catch (err) {
      res.status(500).json({ success: false, message: err.message })
    }
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed' })
  }
}
