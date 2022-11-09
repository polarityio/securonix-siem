const _ = require('lodash');
const { flow, size, get, getOr, orderBy } = require('lodash/fp');

const getAssociatedUsers = require('./getAssociatedUsers');
const getViolations = require('./getViolations');

const createLookupResults = async (responses, entity, foundIncidents, Logger) => {
  const lookupResults = await getLookupResults(responses, entity, foundIncidents, Logger);

  return polarityResponse(entity, lookupResults, Logger);
};

const processResponses = (responseKey, responseValue) => {
  const { direction, key } = getOr({}, responseKey, responseValue);
  const sortedQueryResults = orderBy(key, direction, responseValue);

  return { [responseKey]: sortedQueryResults };
};

const getLookupResults = async (responses, entity, foundIncidents, Logger) => {
  let responses;

  const processedViolationResponse = await processesViolationResponse(
    responses,
    entity,
    foundIncidents,
    Logger
  );

  for (let [queryKey, response] of Object.entries(responses)) {
    if (get('length', response.value)) {
      responses = processResponses(queryKey, response.value, Logger);
    }
  }

  return (results = { ...responses, ...processedViolationResponse });
};

const processesViolationResponse = async (responses, entity, foundIncidents, Logger) => {
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

  // conditionally adding properties to violation response, property wont be added if there is no data.
  return {
    ...(associatedUsers.length && { associatedUsers: associatedUsers }),
    ...(violations.length && {
      violation: violations
    }),
    ...(violationsCount && { violationsCount: violationsCount }),
    ...(incidents && {
      incidents: incidents
    })
  };
};

const polarityResponse = (entity, details, Logger) => {
  return Object.keys(details).length
    ? {
        entity,
        data: {
          summary: createSummaryTags(details, Logger),
          details
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

  const violationSize = getPathSize('violation');
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

module.exports = createLookupResults;
