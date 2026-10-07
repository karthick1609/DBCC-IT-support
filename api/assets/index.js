const { supabaseService } = require('../../server/supabase')
const { requireRole } = require('../../server/auth')

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    const user = await requireRole(req, res, ['admin', 'principal'])
    if (!user) return
    const { page = 1, per_page = 20, search = '' } = req.query
    const pageNumber = Math.max(1, Number.parseInt(page, 10) || 1)
    const pageSize = Math.min(100, Math.max(1, Number.parseInt(per_page, 10) || 20))
    const offset = (pageNumber - 1) * pageSize
    try {
      let query = supabaseService.from('assets').select('*, asset_categories(name), locations(name), departments(name), users(full_name)').order('created_at', { ascending: false }).range(offset, offset + pageSize - 1)
      if (search) query = query.ilike('asset_name', `%${search.replace(/[%_]/g, '')}%`)
      const { data, error } = await query
      if (error) throw error
      return res.json({ success: true, data })
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message })
    }
  } else if (req.method === 'POST') {
    const user = await requireRole(req, res, ['admin'])
    if (!user) return
    try {
      const body = req.body || {}
      if (typeof body.asset_code !== 'string' || !body.asset_code.trim() ||
          typeof body.asset_name !== 'string' || !body.asset_name.trim()) {
        return res.status(400).json({ success: false, message: 'Asset ID and asset name are required.' })
      }
      const categoryName = typeof body.category === 'string' ? body.category.trim() : ''
      let categoryId = body.category_id || null
      if (categoryName && !categoryId) {
        const { data: category, error: categoryError } = await supabaseService
          .from('asset_categories').select('id').eq('name', categoryName).maybeSingle()
        if (categoryError) throw categoryError
        categoryId = category && category.id
        if (!categoryId) return res.status(400).json({ success: false, message: 'Select a valid asset category.' })
      }
      const payload = {
        asset_code: body.asset_code.trim(),
        asset_name: body.asset_name.trim(),
        category_id: categoryId,
        brand: body.brand || null,
        model: body.model || null,
        serial_number: body.serial_number || null,
        processor: body.processor || null,
        ram: body.ram || null,
        storage: body.storage || null,
        operating_system: body.operating_system || null,
        purchase_date: body.purchase_date || null,
        purchase_cost: body.purchase_cost || null,
        warranty_end: body.warranty_end || null,
        location_id: body.location_id || null,
        department_id: body.department_id || null,
        assigned_user_id: body.assigned_user_id || null,
        status: body.status || 'Active',
        condition: body.condition || 'Good',
        notes: body.notes || null
      }
      const { data, error } = await supabaseService.from('assets').insert(payload).select().single()
      if (error) throw error
      return res.status(201).json({ success: true, data })
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message })
    }
  } else {
    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }
}
