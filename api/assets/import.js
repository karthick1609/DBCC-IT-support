const { supabaseService } = require('../../server/supabase')
const csv = require('csv-parse/lib/sync')

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' })
  try {
    const { csv_text } = req.body
    if (!csv_text) return res.status(400).json({ success: false, message: 'csv_text required' })
    const records = csv(csv_text, { columns: true, skip_empty_lines: true })
    const successes = []
    const failures = []
    const client = supabaseService
    for (const row of records) {
      try {
        // basic validation
        if (!row.asset_code || !row.asset_name) throw new Error('Missing required fields')
        // prevent duplicates by serial or asset_code
        const { data: exists } = await client.from('assets').select('id').or(`asset_code.eq.${row.asset_code},serial_number.eq.${row.serial_number}`)
        if (exists && exists.length) { failures.push({ row, reason: 'Duplicate' }); continue }
        const payload = {
          asset_code: row.asset_code,
          asset_name: row.asset_name,
          category_id: null,
          brand: row.brand || null,
          model: row.model || null,
          serial_number: row.serial_number || null,
          processor: row.processor || null,
          ram: row.ram || null,
          storage: row.storage || null,
          operating_system: row.operating_system || null,
          purchase_date: row.purchase_date || null,
          warranty_end: row.warranty_end || null,
          location_id: null,
          department_id: null,
          assigned_user_id: null,
          status: row.status || 'Active',
          condition: row.condition || 'Good'
        }
        const { data, error } = await client.from('assets').insert([payload])
        if (error) { failures.push({ row, reason: error.message }); continue }
        successes.push(data[0])
      } catch (err) { failures.push({ row, reason: err.message }) }
    }
    res.json({ success: true, summary: { total: records.length, imported: successes.length, failed: failures.length }, successes, failures })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}
