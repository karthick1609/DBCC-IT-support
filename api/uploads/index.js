const { supabaseService } = require('../../server/supabase')
const { requireRole } = require('../../server/auth')
const { randomUUID } = require('crypto')
const path = require('path')

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }
  const body = req.body || {}
  const bucket = body.bucket || 'ticket-attachments'
  const roles = bucket === 'ticket-attachments' ? ['staff', 'admin', 'principal'] : ['admin']
  if (!['ticket-attachments', 'asset-images', 'asset-documents'].includes(bucket)) {
    return res.status(400).json({ success: false, message: 'Unsupported upload bucket.' })
  }
  const user = await requireRole(req, res, roles)
  if (!user) return
  try {
    const { filename, content_base64, mime_type } = body
    if (typeof filename !== 'string' || typeof content_base64 !== 'string' || !content_base64) {
      return res.status(400).json({ success: false, message: 'filename and content_base64 are required.' })
    }
    if (content_base64.length > 7000000) {
      return res.status(413).json({ success: false, message: 'File exceeds the 5 MB upload limit.' })
    }
    const buffer = Buffer.from(content_base64, 'base64')
    const safeName = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_')
    const storagePath = `${user.profile.id}/${randomUUID()}-${safeName}`
    const { data, error } = await supabaseService.storage.from(bucket).upload(storagePath, buffer, { contentType: mime_type })
    if (error) throw error
    const url = supabaseService.storage.from(bucket).getPublicUrl(data.path).data.publicUrl
    res.status(201).json({ success: true, data: { path: data.path, url } })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}
