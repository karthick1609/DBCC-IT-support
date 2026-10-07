const { supabaseService } = require('../../server/supabase')

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
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed' })
  const { type } = req.query
  try {
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
      const tickets = await fetchAllRows('tickets', 'department_id')
      const counts = tickets.reduce((summary, ticket) => {
        const departmentId = ticket.department_id || null
        summary[departmentId] = (summary[departmentId] || 0) + 1
        return summary
      }, {})
      const data = Object.entries(counts).map(([department_id, count]) => ({
        department_id: department_id === 'null' ? null : department_id,
        count
      }))
      return res.json({ success: true, data })
    }
    return res.status(400).json({ success: false, message: 'Missing or invalid type' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}
