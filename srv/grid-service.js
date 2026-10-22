const cds = require('@sap/cds')

const CRITICALITY = { PLANNED: 0, IN_PROGRESS: 2, ON_HOLD: 1, COMPLETED: 3 }

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

    // keep the project's total hours in sync with all of its work orders
    this.after(['CREATE', 'UPDATE'], WorkOrders, async changed => {
      const workOrders = Array.isArray(changed) ? changed : [changed]
      const projectIds = new Set()

      for (const workOrder of workOrders) {
        const persisted = await db.run(
          SELECT.one.from(DbWorkOrders, workOrder.ID).columns('project_ID')
        )
        if (persisted?.project_ID) projectIds.add(persisted.project_ID)
      }

      for (const project_ID of projectIds) {
        const orders = await db.run(
          SELECT.from(DbWorkOrders).where({ project_ID }).columns('actualHours')
        )
        const totalActualHours = orders.reduce(
          (total, order) => total + Number(order.actualHours || 0),
          0
        )
        await db.run(UPDATE(DbProjects, project_ID).set({ totalActualHours }))
      }
    })

    this.on('complete', Projects, async req => {
      const key = req.params[0]
      const ID = typeof key === 'object' ? key.ID : key
      const orders = await db.run(SELECT.from(DbWorkOrders).where({ project_ID: ID }))
      if (orders.length === 0 || orders.some(o => o.status !== 'COMPLETED')) {
        return req.reject(409, 'All work orders must be completed before the project can be completed')
      }
      await db.run(UPDATE(DbProjects, ID).set({ status: 'COMPLETED' }))
      return this.read(Projects, ID)
    })

    this.before(['CREATE', 'UPDATE'], MaterialRequests, req => {
      if (req.data.quantity === undefined || req.data.quantity === null) return

      const quantity = Number(req.data.quantity)
      if (!Number.isFinite(quantity) || quantity <= 0) {
        return req.reject(400, 'Quantity must be greater than 0')
      }
    })

    // enrich material requests with the current stock from S/4HANA
    this.after('READ', MaterialRequests, async rows => {
      const requests = Array.isArray(rows) ? rows : [rows]

      await Promise.all(requests.map(async r => {
        if (!r?.material || !r.plant) return

        try {
          const stock = await s4.run(
            SELECT.from(MaterialStock).where({ Material: r.material, Plant: r.plant })
          )
          r.availableStock = stock.reduce(
            (total, item) => total + Number(item.MatlWrhsStkQtyInMatlBaseUnit || 0),
            0
          )
          r.stockStatus = r.availableStock >= Number(r.quantity) ? 'AVAILABLE' : 'SHORTAGE'
        } catch (error) {
          // Stock is unknown, not zero, when S/4 rejects a request (for example
          // because the technical user lacks access to a plant).
          r.availableStock = null
          r.stockStatus = 'UNKNOWN'
        }
      }))
    })

    return super.init()
  }
}
