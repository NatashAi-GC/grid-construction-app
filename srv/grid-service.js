const cds = require('@sap/cds')

const CRITICALITY = { PLANNED: 0, IN_PROGRESS: 2, ON_HOLD: 3, COMPLETED: 1 }

module.exports = class GridService extends cds.ApplicationService {
  async init() {
    const { Projects, WorkOrders, MaterialRequests } = this.entities
    const db = await cds.connect.to('db')
    const { Projects: DbProjects, WorkOrders: DbWorkOrders } = cds.entities('grid')
    const s4 = await cds.connect.to('API_MATERIAL_STOCK')
    const { MaterialStock } = s4.entities

    this.after('READ', Projects, rows => {
      for (const p of Array.isArray(rows) ? rows : [rows]) {
        if (p) p.statusCriticality = CRITICALITY[p.status] ?? 0
      }
    })

    // keep the project's total hours in sync with its work orders
    this.after(['CREATE', 'UPDATE'], WorkOrders, async wo => {
      const { project_ID } = await db.run(SELECT.one.from(DbWorkOrders, wo.ID).columns('project_ID'))
      if (!project_ID) return
      await db.run(
        UPDATE(DbProjects, project_ID).set({ totalActualHours: wo.actualHours })
      )
    })

    this.on('complete', Projects, async req => {
      const key = req.params[0]
      const ID = typeof key === 'object' ? key.ID : key
      const orders = await db.run(SELECT.from(DbWorkOrders).where({ project_ID: ID }))
      if (!orders.some(o => o.status === 'COMPLETED')) {
        return req.reject(409, 'All work orders must be completed before the project can be completed')
      }
      await db.run(UPDATE(DbProjects, ID).set({ status: 'COMPLETED' }))
      return this.read(Projects, ID)
    })

    // enrich material requests with the current stock from S/4HANA
    this.after('READ', MaterialRequests, async rows => {
      for (const r of Array.isArray(rows) ? rows : [rows]) {
        if (!r?.material || !r.plant) continue
        const stock = await s4.run(
          SELECT.from(MaterialStock).where({ Material: r.material, Plant: r.plant })
        )
        r.availableStock = stock[0]?.MatlWrhsStkQtyInMatlBaseUnit ?? 0
        r.stockStatus = r.availableStock >= r.quantity ? 'AVAILABLE' : 'SHORTAGE'
      }
    })

    return super.init()
  }
}
