const { supabaseService } = require('../../server/supabase')
const { requireRole } = require('../../server/auth')

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    const user = await requireRole(req, res, ['admin'])
    if (!user) return
    try {
      const { data, error } = await supabaseService
        .from('users')
        .select('id,full_name,email,role,status,department_id')
      if (error) throw error

      const departmentIds = [...new Set(data.map(profile => profile.department_id).filter(Boolean))]
      let departmentsById = new Map()
      if (departmentIds.length) {
        const { data: departments, error: departmentsError } = await supabaseService
          .from('departments')
          .select('id,name')
          .in('id', departmentIds)
        if (departmentsError) throw departmentsError
        departmentsById = new Map(departments.map(department => [department.id, department]))
      }

      const profiles = data.map(profile => ({
        id: profile.id,
        full_name: profile.full_name,
        email: profile.email,
        role: profile.role,
        status: profile.status,
        department: departmentsById.has(profile.department_id)
          ? { name: departmentsById.get(profile.department_id).name }
          : null
      }))
      res.json({ success: true, data: profiles })
    } catch (err) {
      res.status(500).json({ success: false, message: err.message })
    }
  } else {
    res.setHeader('Allow', 'GET')
    res.status(405).json({ success: false, message: 'Method not allowed' })
  }
}
