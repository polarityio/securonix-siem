const getAllIncidents = require('./getAllIncidents');
const getIncidentsForEachEntity = require('./getIncidentsForEachEntity');

const getIncidents = async (singleEntity, options, requestsInParallel, Logger) => {
  const allIncidents = await getAllIncidents(options, requestsInParallel, Logger);

  const incidentsWithEachEntity = getIncidentsForEachEntity(
    singleEntity,
    allIncidents,
    Logger
  );

  return incidentsWithEachEntity;
};

module.exports = getIncidents;
