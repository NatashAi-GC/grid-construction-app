const cds = require('@sap/cds')
const { createServer } = require('../s4-mock/server')

const { GET, POST, PATCH } = cds.test(__dirname + '/..')
const P1 = '11111111-1111-1111-1111-111111111111'
let s4
beforeAll(done => { s4 = createServer().listen(4010, done) })
afterAll(done => s4.close(done))

describe('Projects', () => {
  test('ISSUE-1: rejects endDate before startDate', async () => {
    await expect(POST('/odata/v4/grid/Projects', { name: 'X', startDate: '2026-05-01', endDate: '2026-04-01' }))
      .rejects.toMatchObject({ response: { status: 400 } })
  })

  test('ISSUE-2: status criticality (COMPLETED=3, ON_HOLD=1, IN_PROGRESS=2)', async () => {
    const { data } = await GET('/odata/v4/grid/Projects?$select=status,statusCriticality')
    const byStatus = Object.fromEntries(data.value.map(p => [p.status, p.statusCriticality]))
    expect(byStatus.ON_HOLD).toBe(1)
    expect(byStatus.IN_PROGRESS).toBe(2)
  })

  test('ISSUE-4: totalActualHours is the sum of all work orders', async () => {
    await PATCH('/odata/v4/grid/WorkOrders(a0000000-0000-0000-0000-000000000002)', { actualHours: 100 })
    const { data } = await GET(`/odata/v4/grid/Projects(${P1})`)
    expect(Number(data.totalActualHours)).toBe(420)
  })

  test('ISSUE-6: complete is rejected while work orders are still open', async () => {
    await expect(POST(`/odata/v4/grid/Projects(${P1})/GridService.complete`, {}))
      .rejects.toMatchObject({ response: { status: 409 } })
  })
})

describe('MaterialRequests', () => {
  test('ISSUE-5: rejects quantity <= 0', async () => {
    await expect(POST('/odata/v4/grid/MaterialRequests', { project_ID: P1, material: 'CABLE-110KV-XLPE', plant: '1010', quantity: -5, unit: 'M' }))
      .rejects.toMatchObject({ response: { status: 400 } })
  })

  test('ISSUE-7: stock is summed over storage locations and compared numerically', async () => {
    const { data } = await GET(`/odata/v4/grid/MaterialRequests?$filter=project_ID eq ${P1}&$select=material,plant,quantity,availableStock,stockStatus`)
    const by = Object.fromEntries(data.value.map(m => [m.material, m]))
    expect(Number(by['CABLE-110KV-XLPE'].availableStock)).toBe(1300)
    expect(by['CABLE-110KV-XLPE'].stockStatus).toBe('AVAILABLE')
    expect(by['INSUL-CERAMIC-110'].stockStatus).toBe('SHORTAGE')
  })

  test('ISSUE-8: one failing S/4 lookup must not break the whole list', async () => {
    const { status, data } = await GET('/odata/v4/grid/MaterialRequests')
    expect(status).toBe(200)
    expect(data.value.find(m => m.plant === '3000').stockStatus).toBe('UNKNOWN')
  })
})
