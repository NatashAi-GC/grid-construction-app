# Grid Construction Projects (CAP + mocked S/4HANA)

CAP (Node.js) application to manage power grid construction projects (overhead lines, substations, cable links) with work orders and material requests. Material stock is read from S/4HANA (`API_MATERIAL_STOCK`), which is mocked locally.

## Structure

| Path | Purpose |
|---|---|
| `db/schema.cds` | Domain model: Projects, WorkOrders, MaterialRequests |
| `srv/grid-service.cds/.js` | OData V4 service `/odata/v4/grid` and business logic |
| `srv/external/API_MATERIAL_STOCK.cds` | Simplified S/4 stock API (remote service) |
| `s4-mock/server.js` | Stand-in for the S/4 system (port 4010) – not part of the app |
| `app/projects` | Fiori elements List Report / Object Page |
| `test/grid.test.js` | Jest tests (`ISSUE-n` tests describe the expected behavior) |

## Run

```sh
npm install
npm run dev      # starts the S/4 mock (4010) and the CAP server (4004)
npm test         # starts the mock itself
```

UI: http://localhost:4004/projects/webapp/index.html (needs internet for the UI5 CDN)

## Known S/4 users / plants

The CAP app calls S/4 with the technical user `CAP_TECH_USER`. Plants: `1010`, `2000`, `3000`.
