const getAllIncidents = require('./getAllIncidents');
const getIncidentsForEachEntity = require('./getIncidentsForEachEntity');

const getIncidents = async (singleEntity, options, requestsInParallel, Logger) => {
  Logger.trace({ HERE: 4444444 });

  const allIncidents = await getAllIncidents(options, requestsInParallel, Logger);
  Logger.trace({ HERE: 22222222 });
  const incidentsWithEachEntity = getIncidentsForEachEntity(
    singleEntity,
    allIncidents,
    Logger
  );
  Logger.trace({ HERE: 3333333 });

  return incidentsWithEachEntity;
};

module.exports = getIncidents;
