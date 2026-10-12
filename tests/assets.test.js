const assert = require('assert')

const supabasePath = require.resolve('../server/supabase')
const authPath = require.resolve('../server/auth')
const roleChecks = []
let selectedColumns
const assetRows = [{
  id: 'asset-1',
  asset_code: 'DB-001',
  asset_name: 'Staff laptop',
  asset_categories: { name: 'Laptop' },
  locations: { name: 'Office' },
  status: 'Active'
}]

const query = {
  select(columns) {
    selectedColumns = columns
    return query
  },
  order() {
    return query
  },
  range() {
    return query
  },
  then(resolve, reject) {
    return Promise.resolve({ data: assetRows, error: null }).then(resolve, reject)
  }
}

require.cache[supabasePath] = {
  id: supabasePath,
  filename: supabasePath,
  loaded: true,
  exports: { supabaseService: { from: table => {
    assert.strictEqual(table, 'assets')
    return query
  } } }
}
require.cache[authPath] = {
  id: authPath,
  filename: authPath,
  loaded: true,
  exports: {
    requireRole: async (req, res, roles) => {
      roleChecks.push({ method: req.method, roles })
      if (req.method === 'GET') return { profile: { role: 'staff' } }
      res.status(403).json({ success: false, message: 'Forbidden' })
      return null
    }
  }
}

const listAssets = require('../api/assets')

function mockResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code
      return this
    },
    json(body) {
      this.body = body
      return this
    }
  }
}

async function run() {
  const response = mockResponse()
  await listAssets({ method: 'GET', query: {} }, response)
  assert.strictEqual(response.statusCode, 200)
  assert.strictEqual(response.body.data[0].asset_code, 'DB-001')
  assert.deepStrictEqual(roleChecks[0], {
    method: 'GET',
    roles: ['admin', 'principal', 'staff']
  })
  assert.strictEqual(selectedColumns, 'id,asset_code,asset_name,status,asset_categories(name),locations(name)')

  const deniedResponse = mockResponse()
  await listAssets({ method: 'POST', query: {}, body: {} }, deniedResponse)
  assert.strictEqual(deniedResponse.statusCode, 403)
  assert.deepStrictEqual(roleChecks[1], { method: 'POST', roles: ['admin'] })

  const frontendRoot = require('path').join(__dirname, '..', 'public', 'frontend')
  const assetsHtml = require('fs').readFileSync(require('path').join(frontendRoot, 'admin', 'assets.html'), 'utf8')
  const importHtml = require('fs').readFileSync(require('path').join(frontendRoot, 'admin', 'import-csv.html'), 'utf8')
  const templatePath = require('path').join(frontendRoot, 'assets', 'templates', 'asset-import-template.csv')
  const templateColumns = require('fs').readFileSync(templatePath, 'utf8').trim().split(',')
  const importApi = require('fs').readFileSync(require('path').join(__dirname, '..', 'api', 'assets', 'import.js'), 'utf8')
  const supportedColumns = ['asset_code', 'asset_name', 'brand', 'model', 'serial_number', 'processor', 'ram', 'storage', 'operating_system', 'purchase_date', 'warranty_end', 'status', 'condition']
  assert.deepStrictEqual(templateColumns, supportedColumns)
  assert(importApi.includes('row.asset_code') && importApi.includes('row.asset_name'))
  assert(assetsHtml.includes('Download CSV Template') && assetsHtml.includes('/frontend/assets/templates/asset-import-template.csv'))
  assert(importHtml.includes('Download CSV Template') && importHtml.includes('Required columns:'))

  console.log('Staff asset read-only access validation passed.')
}

run().catch(error => {
  console.error('Staff asset read-only access validation failed:', error.message)
  process.exitCode = 1
})
