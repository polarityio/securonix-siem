const _ = require('lodash');
const { flow, size, get } = require('lodash/fp');

const getAssociatedUsers = require('./getAssociatedUsers');
const getViolations = require('./getViolations');

const { MAX_VIOLATION_RESULTS, MAX_INCIDENTS_RESULTS } = require('../constants');

const createLookupResults = async (
  options,
  responses,
  entity,
  foundIncidents,
  Logger
) => {
  const { users, tpi, riskscore, assets } = responses;

  const violations = await processesViolationResponse(
    options,
    responses,
    entity,
    foundIncidents,
    Logger
  );

  const apiData = {
    ...violations,
    users: users.value,
    tpi: tpi.value,
    riskscore: riskscore.value,
    asset: assets.value
  };

  return polarityResponse(entity, apiData, Logger);
};

const processesViolationResponse = async (
  options,
  responses,
  entity,
  foundIncidents,
  Logger
) => {
  const associatedUsers = getAssociatedUsers(responses.violation.value, Logger);
  const violations = getViolations(
    associatedUsers,
    responses.violation.value,
    entity.transformedEntityType,
    Logger
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

  return response;
};

const polarityResponse = (entity, apiData, Logger) => {
  return apiData.violations || apiData.users || apiData.tpi
    ? {
        entity,
        data: {
          summary: createSummaryTags(apiData, Logger),
          details: apiData
        }
      }
    : emptyResponse(entity);
};

const emptyResponse = (entity) => ({
  entity,
  data: null
});

const createSummaryTags = (apiData, Logger) => {
  let tags = [];

  const getPathSize = (path) => flow(get(path), size)(apiData);

  const userSize = getPathSize('users');
  if (userSize) tags.push(`User Size: ${userSize}`);

  const violationSize = getPathSize('violations');
  if (violationSize) tags.push(`Violations: ${violationSize}`);

  const associatedUsers = getPathSize('associatedUsers');
  if (associatedUsers) tags.push(`Associated Users: ${associatedUsers}`);

  const incidents = getPathSize('incidents');
  if (incidents) tags.push(`Incidents: ${incidents}`);

  const tpi = getPathSize('tpi');
  if (tpi) tags.push(`TPI: ${tpi}`);

  const riskscore = getPathSize('riskscore');
  if (riskscore) tags.push(`Risk Score: ${riskscore}`);

  const asset = getPathSize('asset');
  if (asset) tags.push(`Asset: ${asset}`);

  Logger.trace({ tags }, 'List of tags');
  return tags;
};

// const sortQueryResults = (
//   queryResults,
//   queryResultForThisEntity,
//   queryResponseKey,
//   Logger
// ) => {
//   const { direction, key, maxResultCount } = getOr({}, queryResponseKey, queryResults);
//   const sortedQueryResults = orderBy(key, direction, queryResultForThisEntity);
//   const sortedLimitedResults = slice(0, maxResultCount, sortedQueryResults);
//   return sortedLimitedResults;
// };

module.exports = createLookupResults;
