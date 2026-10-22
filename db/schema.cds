namespace grid;

using { cuid, managed, Currency } from '@sap/cds/common';

// Power grid construction project (e.g. new 110 kV overhead line, substation)
entity Projects : cuid, managed {
  name             : String(100) @mandatory;
  region           : String(40);
  voltageLevel     : Integer;                 // in kV
  status           : String(20) default 'PLANNED'; // PLANNED, IN_PROGRESS, ON_HOLD, COMPLETED
  budget           : Decimal(15, 2);
  currency         : Currency;
  startDate        : Date;
  endDate          : Date;
  totalActualHours : Decimal(9, 2) default 0;
  workOrders       : Composition of many WorkOrders on workOrders.project = $self;
  materials        : Composition of many MaterialRequests on materials.project = $self;
}

entity WorkOrders : cuid {
  project      : Association to Projects;
  title        : String(120);
  status       : String(20) default 'OPEN';   // OPEN, IN_PROGRESS, COMPLETED
  plannedHours : Decimal(9, 2);
  actualHours  : Decimal(9, 2) default 0;
  crew         : String(60);
}

// Material needed for a project; stock is checked against S/4HANA
entity MaterialRequests : cuid {
  project        : Association to Projects;
  material       : String(40);                // S/4 material number
  description    : String(120);
  plant          : String(4);                 // S/4 plant
  quantity       : Decimal(13, 3);
  unit           : String(3);
  availableStock : Decimal(13, 3);            // filled from S/4 on read
  stockStatus    : String(20);                // AVAILABLE, SHORTAGE, UNKNOWN
}
