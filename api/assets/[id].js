const { supabaseService } = require('../../server/supabase')
const { generateAssetQrData } = require('../../utils/qr')

module.exports = async (req, res) => {
  const { id } = req.query
  if (!id) return res.status(400).json({ success: false, message: 'Asset id required' })

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabaseService.from('assets').select('*, asset_categories(name)').eq('id', id).single()
      if (error) throw error
      res.json({ success: true, data })
    } catch (err) {
      res.status(500).json({ success: false, message: err.message })
    }
  } else if (req.method === 'POST' && req.query.action === 'qr') {
    try {
      const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : (process.env.BASE_URL || 'http://localhost:3000')
      const qr = await generateAssetQrData(id, baseUrl)
      res.json({ success: true, data: qr })
    } catch (err) {
      res.status(500).json({ success: false, message: err.message })
    }
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed' })
  }
}
