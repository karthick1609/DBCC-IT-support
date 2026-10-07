const { supabaseService } = require('../../server/supabase')

module.exports = async (req, res) => {
  const { id } = req.query
  if (!id) return res.status(400).json({ success: false, message: 'Ticket id required' })

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabaseService.from('tickets').select('*, ticket_categories(name), users(full_name)').eq('id', id).single()
      if (error) throw error
      const { data: comments } = await supabaseService.from('ticket_comments').select('*, users(full_name)').eq('ticket_id', id).order('created_at', { ascending: true })
      res.json({ success: true, data: { ticket: data, comments } })
    } catch (err) {
      res.status(500).json({ success: false, message: err.message })
    }
  } else if (req.method === 'POST' && req.query.action === 'comment') {
    try {
      const { user_id, message, attachment_url } = req.body
      const payload = { ticket_id: id, user_id, message, attachment_url }
      const { data, error } = await supabaseService.from('ticket_comments').insert([payload])
      if (error) throw error
      res.status(201).json({ success: true, data: data[0] })
    } catch (err) {
      res.status(500).json({ success: false, message: err.message })
    }
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed' })
  }
}
