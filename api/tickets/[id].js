const { supabaseService } = require('../../server/supabase')
const { requireRole } = require('../../server/auth')

module.exports = async (req, res) => {
  if (!['GET', 'POST', 'PUT'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST, PUT')
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }
  const user = await requireRole(req, res, ['staff', 'admin', 'principal'])
  if (!user) return
  const { id } = req.query
  if (!id) return res.status(400).json({ success: false, message: 'Ticket id required' })

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabaseService
        .from('tickets')
        .select('*, ticket_categories(name), requester:users!tickets_requester_id_fkey(full_name,email), departments(name), locations(name)')
        .eq('id', id)
        .single()
      if (error) throw error
      if (user.profile.role === 'staff' && data.requester_id !== user.profile.id) {
        return res.status(404).json({ success: false, message: 'Ticket not found.' })
      }
      const { data: comments, error: commentsError } = await supabaseService
        .from('ticket_comments')
        .select('*, users(full_name)')
        .eq('ticket_id', id)
        .order('created_at', { ascending: true })
      if (commentsError) throw commentsError
      res.json({ success: true, data: { ticket: data, comments } })
    } catch (err) {
      res.status(500).json({ success: false, message: err.message })
    }
  } else if (req.method === 'POST' && req.query.action === 'comment') {
    try {
      const body = req.body || {}
      const message = typeof body.message === 'string' ? body.message.trim() : ''
      if (!message) return res.status(400).json({ success: false, message: 'Comment message is required.' })
      const { data: ticket, error: ticketError } = await supabaseService
        .from('tickets').select('requester_id').eq('id', id).maybeSingle()
      if (ticketError) throw ticketError
      if (!ticket || (user.profile.role === 'staff' && ticket.requester_id !== user.profile.id)) {
        return res.status(404).json({ success: false, message: 'Ticket not found.' })
      }
      const payload = {
        ticket_id: id,
        user_id: user.profile.id,
        message,
        attachment_url: typeof body.attachment_url === 'string' ? body.attachment_url : null
      }
      const { data, error } = await supabaseService.from('ticket_comments').insert(payload).select().single()
      if (error) throw error
      res.status(201).json({ success: true, data })
    } catch (err) {
      res.status(500).json({ success: false, message: err.message })
    }
  } else if (req.method === 'PUT') {
    if (user.profile.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only administrators can update ticket status.' })
    }
    const status = (req.body || {}).status
    if (!['In Progress', 'Completed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Choose In Progress or Completed as the ticket status.' })
    }
    try {
      const { data: current, error: currentError } = await supabaseService
        .from('tickets')
        .select('id,status')
        .eq('id', id)
        .maybeSingle()
      if (currentError) throw currentError
      if (!current) return res.status(404).json({ success: false, message: 'Ticket not found.' })

      const expectedStatus = status === 'In Progress' ? 'Open' : 'In Progress'
      if (current.status !== expectedStatus) {
        return res.status(409).json({
          success: false,
          message: status === 'In Progress'
            ? 'Only open tickets can be accepted.'
            : 'Only in-progress tickets can be marked completed.'
        })
      }

      const { data, error } = await supabaseService
        .from('tickets')
        .update({ status })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return res.json({ success: true, data })
    } catch (err) {
      console.error('Ticket status update failed:', err.message)
      return res.status(500).json({ success: false, message: 'Unable to update ticket status.' })
    }
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed' })
  }
}
