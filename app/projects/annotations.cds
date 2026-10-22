using GridService from '../../srv/grid-service';

annotate GridService.Projects with @(
  UI.HeaderInfo: {
    TypeName: 'Project',
    TypeNamePlural: 'Projects',
    Title: { Value: name },
    Description: { Value: region }
  },
  UI.SelectionFields: [ region, status ],
  UI.LineItem: [
    { Value: name, Label: 'Project' },
    { Value: region },
    { Value: voltageLevel },
    { Value: status, Criticality: statusCriticality },
    { Value: budget },
    { Value: startDate },
    { Value: endDate },
    { Value: totalActualHours }
  ],
  UI.Facets: [
    { $Type: 'UI.ReferenceFacet', Label: 'General', Target: '@UI.FieldGroup#General' },
    { $Type: 'UI.ReferenceFacet', Label: 'Work Orders', Target: 'workOrders/@UI.LineItem' },
    { $Type: 'UI.ReferenceFacet', Label: 'Material Requests', Target: 'materials/@UI.LineItem' }
  ],
  UI.FieldGroup #General: { Data: [
    { Value: name }, { Value: region }, { Value: voltageLevel }, { Value: status, Criticality: statusCriticality },
    { Value: budget }, { Value: startDate }, { Value: endDate }, { Value: totalActualHours }
  ]},
  UI.Identification: [
    { $Type: 'UI.DataFieldForAction', Action: 'GridService.complete', Label: 'Complete Project' }
  ]
);

annotate GridService.Projects with {
  name             @title: 'Project Name';
  region           @title: 'Region';
  voltageLevel     @title: 'Voltage (kV)';
  status           @title: 'Status';
  budget           @title: 'Budget';
  currency         @title: 'Currency';
  startDate        @title: 'Start Date';
  endDate          @title: 'End Date';
  totalActualHours @title: 'Actual Hours';
};

annotate GridService.WorkOrders with @(
  UI.LineItem: [
    { Value: title }, { Value: status }, { Value: plannedHours }, { Value: actualHours }, { Value: crew }
  ]
);

annotate GridService.MaterialRequests with @(
  UI.LineItem: [
    { Value: material }, { Value: description }, { Value: plant }, { Value: quantity }, { Value: unit },
    { Value: availableStock, Label: 'Stock (S/4)' }, { Value: stockStatus, Label: 'Stock Status' }
  ]
);
