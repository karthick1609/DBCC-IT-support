const crypto = require('crypto')
const { supabaseService } = require('../../server/supabase')
const { requireRole } = require('../../server/auth')

module.exports = async (req, res) => {
  if (!['GET', 'POST'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  const user = await requireRole(req, res, ['staff', 'admin', 'principal'])
  if (!user) return

  try {
    if (req.method === 'GET') {
      const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1)
      const perPage = Math.min(100, Math.max(1, Number.parseInt(req.query.per_page, 10) || 20))
      let query = supabaseService
        .from('tickets')
        .select('*, requester:users!tickets_requester_id_fkey(full_name,email), ticket_categories(name), departments(name), locations(name)')
        .order('created_at', { ascending: false })
        .range((page - 1) * perPage, page * perPage - 1)

      if (user.profile.role === 'staff') query = query.eq('requester_id', user.profile.id)
      const { data, error } = await query
      if (error) throw error
      return res.status(200).json({ success: true, data })
    }

    const body = req.body || {}
    const title = typeof body.title === 'string' ? body.title.trim() : ''
    const description = typeof body.description === 'string' ? body.description.trim() : ''
    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Ticket title and description are required.' })
    }

    const categoryName = typeof body.category === 'string' ? body.category.trim() : ''
    let categoryId = body.category_id || null
    if (categoryName && !categoryId) {
      const { data: category, error } = await supabaseService
        .from('ticket_categories').select('id').eq('name', categoryName).maybeSingle()
      if (error) throw error
      categoryId = category && category.id
      if (!categoryId) return res.status(400).json({ success: false, message: 'Select a valid ticket category.' })
    }

    let locationId = body.location_id || null
    if (!locationId && typeof body.location === 'string' && body.location.trim()) {
      const { data: location, error } = await supabaseService
        .from('locations').select('id').eq('name', body.location.trim()).maybeSingle()
      if (error) throw error
      locationId = location && location.id
      if (!locationId) return res.status(400).json({ success: false, message: 'Select a valid location.' })
    }

    const ticketNumber = `DB-HD-${crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()}`
    const payload = {
      ticket_number: ticketNumber,
      title,
      description,
      category_id: categoryId,
      priority: ['Low', 'Medium', 'High', 'Critical'].includes(body.priority) ? body.priority : 'Medium',
      requester_id: user.profile.id,
      department_id: user.profile.department_id || null,
      location_id: locationId
    }
    const { data, error } = await supabaseService.from('tickets').insert(payload).select().single()
    if (error) throw error
    return res.status(201).json({ success: true, data })
  } catch (error) {
    console.error('Ticket request failed:', error.message)
    return res.status(500).json({ success: false, message: 'Unable to process ticket request.' })
  }
}
