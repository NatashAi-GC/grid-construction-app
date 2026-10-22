// Minimal mock of S/4HANA API_MATERIAL_STOCK (OData V4 style JSON).
// Stands in for the real S/4 system. It is NOT part of the CAP application.
const http = require('http')

const STOCK = [
  { Material: 'CABLE-110KV-XLPE', Plant: '1010', StorageLocation: '0001', MatlWrhsStkQtyInMatlBaseUnit: '600.000', MaterialBaseUnit: 'M' },
  { Material: 'CABLE-110KV-XLPE', Plant: '1010', StorageLocation: '0002', MatlWrhsStkQtyInMatlBaseUnit: '700.000', MaterialBaseUnit: 'M' },
  { Material: 'TRAFO-40MVA', Plant: '1010', StorageLocation: '0001', MatlWrhsStkQtyInMatlBaseUnit: '2.000', MaterialBaseUnit: 'PC' },
  { Material: 'PYLON-STEEL-24M', Plant: '2000', StorageLocation: '0001', MatlWrhsStkQtyInMatlBaseUnit: '40.000', MaterialBaseUnit: 'PC' },
  { Material: 'INSUL-CERAMIC-110', Plant: '2000', StorageLocation: '0001', MatlWrhsStkQtyInMatlBaseUnit: '100.000', MaterialBaseUnit: 'PC' },
  { Material: 'SWITCHGEAR-GIS-20', Plant: '3000', StorageLocation: '0001', MatlWrhsStkQtyInMatlBaseUnit: '3.000', MaterialBaseUnit: 'PC' }
]

function parseFilter(filter = '') {
  const cond = {}
  for (const m of filter.matchAll(/(\w+) eq '([^']*)'/g)) cond[m[1]] = m[2]
  return cond
}

function createServer() {
  return http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost')
    const send = (code, body) => {
      res.writeHead(code, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(body))
    }
    if (url.pathname !== '/s4/MaterialStock') return send(404, { error: { code: 'NOT_FOUND', message: 'Resource not found' } })

    const cond = parseFilter(url.searchParams.get('$filter') || '')

    // Plant 3000: technical user lacks authorization object M_MSEG_WWA in S/4.
    // Must be fixed in the S/4 system (role assignment), not in this repository.
    if (cond.Plant === '3000') {
      return send(403, {
        error: {
          code: 'M3/897',
          message: 'No authorization for plant 3000 (authorization object M_MSEG_WWA, activity 03) for user CAP_TECH_USER'
        }
      })
    }
    const value = STOCK.filter(s => Object.entries(cond).every(([k, v]) => s[k] === v))
    send(200, { '@odata.context': '$metadata#MaterialStock', value })
  })
}

module.exports = { createServer }

if (require.main === module) {
  const port = process.env.S4_MOCK_PORT || 4010
  createServer().listen(port, () => console.log(`S/4 mock listening on http://localhost:${port}/s4`))
}
