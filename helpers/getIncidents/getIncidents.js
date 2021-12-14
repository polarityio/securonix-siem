const getAllIncidents = require('./getAllIncidents');
const getIncidentsForEachEntity = require('./getIncidentsForEachEntity');

const getIncidents = async (entitiesPartition, options, requestWithDefaults, Logger) => {
  const allIncidents = await getAllIncidents(options, requestWithDefaults, Logger);

  const incidentsWithEachEntity = getIncidentsForEachEntity(
    entitiesPartition,
    allIncidents,
    Logger
  );

  return incidentsWithEachEntity;
};

module.exports = getIncidents;
