// Simplified model of the S/4HANA OData API "API_MATERIAL_STOCK_SRV" (entity A_MatlStkInAcctMod)
@cds.external
service API_MATERIAL_STOCK {
  entity MaterialStock {
    key Material                    : String(40);
    key Plant                       : String(4);
    key StorageLocation             : String(4);
        MatlWrhsStkQtyInMatlBaseUnit : Decimal(13, 3);
        MaterialBaseUnit            : String(3);
  }
}
