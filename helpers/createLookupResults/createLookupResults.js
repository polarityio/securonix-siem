const _ = require('lodash');

const getViolationsForThisEntity = require('./getViolationsForThisEntity');
const getAssociatedUsers = require('./getAssociatedUsers');
const getViolations = require('./getViolations');

const { MAX_VIOLATION_RESULTS, MAX_INCIDENTS_RESULTS } = require('../constants');
const getUsersByEmail = require('./getUsersByEmail');
const getTpiDomain = require('./getTpiDomain');
const getAssets = require('./getAssests');
const getRiskHistory = require('./getRiskHistory');

const createLookupResults = async (
  options,
  { body: { events } },
  incidents,
  entityGroups,
  requestWithDefaults,
  Logger
) => {
  const lookupResults = await Promise.all(
    Object.entries(entityGroups).map(async ([entityGroupType, entities]) => {
      const results = await _getLookupResultForThisEntity(
        options,
        events,
        incidents,
        entities,
        entityGroupType,
        requestWithDefaults,
        Logger
      );
      return results;
    })
  );
  return lookupResults;
};

const _getLookupResultForThisEntity = async (
  options,
  events,
  foundIncidents,
  entities,
  entityGroupType,
  requestWithDefaults,
  Logger
) => {
  for (const entity of entities) {
    const violations = await processesViolationResponse(
      options,
      entity,
      entityGroupType,
      events,
      foundIncidents,
      Logger
    );
    const usersByEmail = await getUsersByEmail(
      options,
      entity,
      requestWithDefaults,
      Logger
    );
    const tpiDomains = await getTpiDomain(options, entity, requestWithDefaults, Logger);

    const assets = await getAssets(options, entity, requestWithDefaults, Logger);

    const riskHistory = await getRiskHistory(
      options,
      entity,
      requestWithDefaults,
      Logger
    );

    const responses = {
      ...violations,
      ...usersByEmail,
      ...tpiDomains,
      ...assets,
      ...riskHistory
    };

    return polarityResponse(entity, responses, Logger);
  }
};

const polarityResponse = (entity, apiData, Logger) => {
  // need to write conditions
  return apiData.usersByEmail.users.length > 0
    ? {
        entity,
        data: {
          summary: [],
          details: apiData
        }
      }
    : emptyResponse(entity);
};

const emptyResponse = (entity) => ({
  entity,
  data: null
});

const processesViolationResponse = async (
  options,
  entity,
  entityGroupType,
  events,
  foundIncidents,
  Logger
) => {
  const violationEventsForThisEntity = getViolationsForThisEntity(
    events,
    entity,
    entityGroupType
  );

  const associatedUsers = getAssociatedUsers(violationEventsForThisEntity, Logger);

  const violations = getViolations(
    associatedUsers,
    violationEventsForThisEntity,
    entityGroupType
  );

  const violationsCount = violations.reduce(
    (agg, violation) => agg + violation.violationCount,
    0
  );

  const incidents = foundIncidents[entity.value];

  const response = {
    associatedUsers,
    violations: _.chain(violations)
      .orderBy('violationCount', 'desc')
      .slice(0, MAX_VIOLATION_RESULTS)
      .value(),
    violationsCount,
    spotterUrl: `${options.url}/Snypr/spotter/loadDashboard`,
    MAX_VIOLATION_RESULTS,
    incidentsCount: _.size(incidents),
    incidents: _.chain(incidents)
      .orderBy('lastUpdateDate', 'desc')
      .slice(0, MAX_INCIDENTS_RESULTS)
      .value(),
    MAX_INCIDENTS_RESULTS,
    incidentUrl: `${options.url}/Snypr/configurableDashboards/view?menuname=Incident Management&section=10`
  };

  Logger.trace({ VIOLATION_RESPONSE: response });
  return response;
};

module.exports = createLookupResults;
