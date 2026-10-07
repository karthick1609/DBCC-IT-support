const { supabaseService } = require('../../server/supabase')
const csv = require('csv-parse/lib/sync')
const { requireRole } = require('../../server/auth')

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }
  const user = await requireRole(req, res, ['admin'])
  if (!user) return
  try {
    const csvText = typeof (req.body || {}).csv_text === 'string' ? req.body.csv_text : ''
    if (!csvText) return res.status(400).json({ success: false, message: 'csv_text is required.' })
    if (csvText.length > 5000000) return res.status(413).json({ success: false, message: 'CSV exceeds the 5 MB limit.' })
    const records = csv(csvText, { columns: true, skip_empty_lines: true, bom: true })
    if (!records.length) return res.status(400).json({ success: false, message: 'CSV contains no data rows.' })
    const successes = []
    const failures = []
    const client = supabaseService
    for (const row of records) {
      try {
        const assetCode = typeof row.asset_code === 'string' ? row.asset_code.trim() : ''
        const assetName = typeof row.asset_name === 'string' ? row.asset_name.trim() : ''
        if (!assetCode || !assetName) throw new Error('Missing required asset_code or asset_name.')
        const { data: existingCode, error: codeError } = await client
          .from('assets').select('id').eq('asset_code', assetCode).maybeSingle()
        if (codeError) throw codeError
        if (existingCode) { failures.push({ row_number: records.indexOf(row) + 2, reason: 'Asset ID already exists.' }); continue }
        const serialNumber = row.serial_number && row.serial_number.trim()
        if (serialNumber) {
          const { data: existingSerial, error: serialError } = await client
            .from('assets').select('id').eq('serial_number', serialNumber).maybeSingle()
          if (serialError) throw serialError
          if (existingSerial) { failures.push({ row_number: records.indexOf(row) + 2, reason: 'Serial number already exists.' }); continue }
        }
        const payload = {
          asset_code: assetCode,
          asset_name: assetName,
          category_id: null,
          brand: row.brand || null,
          model: row.model || null,
          serial_number: serialNumber || null,
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
        const { data, error } = await client.from('assets').insert(payload).select('id,asset_code')
        if (error) throw error
        successes.push(data[0])
      } catch (err) {
        failures.push({ row_number: records.indexOf(row) + 2, reason: err.message })
      }
    }
    res.json({ success: true, summary: { total: records.length, imported: successes.length, failed: failures.length }, successes, failures })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}
