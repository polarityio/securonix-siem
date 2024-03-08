const { flow, size, get, getOr, orderBy } = require('lodash/fp');

const getAssociatedUsers = require('./getAssociatedUsers');
const getViolations = require('./getViolations');

const createLookupResults = (responses, entity, foundIncidents, Logger) => {
  const lookupResults = getLookupResults(responses, entity, foundIncidents, Logger);
  return polarityResponse(entity, lookupResults, Logger);
};

const getLookupResults = (responses, entity, Logger) => {
  let processedResponses = {};

  const processedViolationResponse = processesViolationResponse(
    responses,
    entity,
    Logger
  );

  // sorts responses and returns the results associated with the query type in an object.
  for (let [queryKey, response] of Object.entries(responses)) {
    if (get('length', response.value)) {
      processedResponses[queryKey] = processResponses(queryKey, response, Logger);
    }
  }

  return (results = { ...processedResponses, ...processedViolationResponse });
};

const processResponses = (responseKey, response, Logger) => {
  const { direction, key } = response;

  if (direction && key) {
    const sortedQueryResults = orderBy(key, direction, response.value);
    return sortedQueryResults;
  } else {
    return response.value;
  }
};

const processesViolationResponse = (responses, entity, Logger) => {
  const associatedUsers = getAssociatedUsers(responses.violations.value, Logger);

  const violations = getViolations(
    associatedUsers,
    responses.violations.value,
    entity.transformedEntityType,
    Logger
  );

  // conditionally adding properties to violation response, property won't be added if there is no data.
  return {
    ...(get('length', associatedUsers) && { associatedUsers: associatedUsers }),
    ...(get('length', violations) && {
      violations: violations
    })
  };
};

const polarityResponse = (entity, details, Logger) => {
  return get('length', Object.values(details))
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

const createSummaryTags = (apiData) => {
  let tags = [];

  const getPathSize = (path) => flow(get(path), size)(apiData);

  const userSize = getPathSize('users');
  if (userSize) tags.push(`User Size: ${userSize}`);

  const violationSize = getPathSize('violations');
  if (violationSize) tags.push(`Violations: ${violationSize}`);

  const associatedUsers = getPathSize('associatedUsers');
  if (associatedUsers) tags.push(`Associated Users: ${associatedUsers}`);

  const tpi = getPathSize('tpi');
  if (tpi) tags.push(`TPI: ${tpi}`);

  const riskscore = getPathSize('riskscore');
  if (riskscore) tags.push(`Risk Score: ${riskscore}`);

  const asset = getPathSize('asset');
  if (asset) tags.push(`Asset: ${asset}`);

  const activity = getPathSize('activity');
  if (activity) tags.push(`Activity: ${activity}`);

  return tags;
};

module.exports = createLookupResults;
