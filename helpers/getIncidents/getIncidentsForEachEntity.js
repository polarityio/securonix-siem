const { filter, flow, includes, some, values, pick } = require('lodash/fp');
const { INCIDENT_QUERY_PATHS } = require('../constants');

const getIncidentsForEachEntity = (singleEntity, allIncidents, Logger) => {
  return {
    [singleEntity.value]: getIncidentsForThisEntity(singleEntity, allIncidents, Logger)
  };
};

const getIncidentsForThisEntity = (entity, allIncidents, Logger) =>
  filter(
    flow(pick(INCIDENT_QUERY_PATHS), values, some(includes(entity.value))),
    allIncidents
  );

module.exports = getIncidentsForEachEntity;
