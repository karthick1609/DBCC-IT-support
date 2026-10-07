const { supabaseService } = require('../../server/supabase')
const { generateAssetQrData } = require('../../utils/qr')

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    const { page = 1, per_page = 20, search = '' } = req.query
    const offset = (page - 1) * per_page
    try {
      let query = supabaseService.from('assets').select('*, asset_categories(name)').order('created_at', { ascending: false }).range(offset, offset + Number(per_page) - 1)
      if (search) {
        query = supabaseService.from('assets').select('*, asset_categories(name)').ilike('asset_name', `%${search}%`).order('created_at', { ascending: false }).range(offset, offset + Number(per_page) - 1)
      }
      const { data, error } = await query
      if (error) throw error
      res.json({ success: true, data })
    } catch (err) {
      res.status(500).json({ success: false, message: err.message })
    }
  } else if (req.method === 'POST') {
    // Create new asset (admin-only should be enforced via middleware)
    try {
      const payload = req.body
      // TODO: validate payload
      const { data, error } = await supabaseService.from('assets').insert([payload])
      if (error) throw error
      res.status(201).json({ success: true, data: data[0] })
    } catch (err) {
      res.status(500).json({ success: false, message: err.message })
    }
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed' })
  }
}
