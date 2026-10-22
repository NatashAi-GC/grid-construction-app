using grid from '../db/schema';

service GridService @(path: '/odata/v4/grid') {

  entity Projects as projection on grid.Projects {
    *,
    virtual statusCriticality : Integer
  } actions {
    action complete() returns Projects;
  };

  entity WorkOrders as projection on grid.WorkOrders;
  entity MaterialRequests as projection on grid.MaterialRequests;

  function searchProjects(term : String) returns many Projects;
}
