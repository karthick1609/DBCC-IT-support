const { supabaseService } = require('../../server/supabase')
const { requireRole } = require('../../server/auth')

async function fetchAllRows(table, columns) {
  const pageSize = 1000
  const rows = []

  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabaseService
      .from(table)
      .select(columns)
      .range(offset, offset + pageSize - 1)

    if (error) throw error
    rows.push(...data)
    if (data.length < pageSize) return rows
  }
}

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }
  const { type } = req.query
  const allowedRoles = type === 'dashboard-summary'
    ? ['staff', 'admin', 'principal']
    : ['admin', 'principal']
  const user = await requireRole(req, res, allowedRoles)
  if (!user) return
  try {
    if (type === 'dashboard-summary') {
      const assets = await fetchAllRows('assets', 'status')
      const tickets = await fetchAllRows('tickets', 'status,requester_id')
      const visibleTickets = user.profile.role === 'staff'
        ? tickets.filter(ticket => ticket.requester_id === user.profile.id)
        : tickets
      const ticketsByStatus = visibleTickets.reduce((summary, ticket) => {
        const status = ticket.status || 'Unspecified'
        summary[status] = (summary[status] || 0) + 1
        return summary
      }, {})
      return res.json({
        success: true,
        data: { assets_total: assets.length, tickets_total: visibleTickets.length, tickets_by_status: ticketsByStatus }
      })
    }
    if (type === 'assets-summary') {
      const assets = await fetchAllRows('assets', 'status')
      const byStatus = assets.reduce((summary, asset) => {
        const status = asset.status || 'Unspecified'
        summary[status] = (summary[status] || 0) + 1
        return summary
      }, {})
      return res.json({ success: true, data: { total: assets.length, by_status: byStatus } })
    }
    if (type === 'tickets-by-department') {
      const tickets = await fetchAllRows('tickets', 'department_id,departments(name)')
      const counts = tickets.reduce((summary, ticket) => {
        const departmentId = ticket.department_id || null
        if (!summary[departmentId]) summary[departmentId] = { count: 0, department_name: ticket.departments && ticket.departments.name || 'Unassigned' }
        summary[departmentId].count += 1
        return summary
      }, {})
      const data = Object.entries(counts).map(([department_id, count]) => ({
        department_id: department_id === 'null' ? null : department_id,
        department_name: count.department_name,
        count: count.count
      }))
      return res.json({ success: true, data })
    }
    if (type === 'warranty-expiry') {
      const now = new Date()
      const cutoff = new Date(now)
      cutoff.setDate(cutoff.getDate() + 90)
      const assets = await fetchAllRows('assets', 'id,asset_code,asset_name,warranty_end,status')
      const data = assets.filter(asset => {
        if (!asset.warranty_end) return false
        const warrantyEnd = new Date(asset.warranty_end)
        return warrantyEnd >= now && warrantyEnd <= cutoff
      })
      return res.json({ success: true, data })
    }
    return res.status(400).json({ success: false, message: 'Missing or invalid type' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}
