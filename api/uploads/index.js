const { supabaseService } = require('../../server/supabase')

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' })
  try {
    // Expecting multipart/form-data — in serverless env parsing is limited. For now accept base64 payload.
    const { bucket = 'ticket-attachments', filename, content_base64, mime_type } = req.body
    if (!filename || !content_base64) return res.status(400).json({ success: false, message: 'filename and content_base64 required' })
    const buffer = Buffer.from(content_base64, 'base64')
    const { data, error } = await supabaseService.storage.from(bucket).upload(filename, buffer, { contentType: mime_type })
    if (error) throw error
    const url = supabaseService.storage.from(bucket).getPublicUrl(data.path).data.publicUrl
    res.status(201).json({ success: true, data: { path: data.path, url } })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}
