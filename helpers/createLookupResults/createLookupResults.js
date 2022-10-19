// const _ = require('lodash');
// const {
//   flow,
//   keys,
//   some,
//   size,
//   get,
//   reduce,
//   orderBy,
//   slice,
//   capitalize,
//   filter,
//   toLower,
//   getOr,
//   includes,
//   map
// } = require('lodash/fp');

// const getAssociatedUsers = require('./getAssociatedUsers');
// const getViolations = require('./getViolations');
// const { getObjectsContainingString } = require('../dataTransformations');

// const { QUERY_KEYS } = require('../constants');

// const createLookupResults = async (options, queryResults, Logger) =>
//   _.flatMap(entityGroups, (groupEntities, entityGroupType) =>
//     groupEntities.map(
//       _aggregateAndProcessResponses(options, queryResults, entityGroupType, Logger)
//     )
//   );

// const _aggregateAndProcessResponses = (
//   options,
//   queryResults,
//   entityGroupType,
//   Logger
// ) => (entity) => {
//   const queryResultsForThisEntity = getQueryResultsForThisEntity(
//     queryResults,
//     entity,
//     entityGroupType,
//     Logger
//   );

//   const associatedUsers = getAssociatedUsers(queryResultsForThisEntity.violation, Logger);

//   const violations = getViolations(
//     associatedUsers,
//     queryResultsForThisEntity.violation,
//     entityGroupType
//   );

//   const queryResultsAreFound = some(size, queryResultsForThisEntity);

//   return {
//     entity,
//     data: queryResultsAreFound
//       ? {
//           summary: createSummaryTags(queryResultsForThisEntity, associatedUsers),
//           details: {
//             ...queryResultsForThisEntity,
//             violations,
//             associatedUsers
//           }
//         }
//       : null
//   };
// };

// const getQueryResultsForThisEntity = (queryResults, entity, entityType, Logger) =>
//   flow(
//     keys,
//     reduce((agg, queryResponseKey) => {
//       const queryResultsForThisKey = get(queryResponseKey, queryResults);
//       const allAssociatedQueryResults = getObjectsContainingString(
//         entity.value,
//         get('value', queryResultsForThisKey),
//         Logger
//       );

//       const queryResultForThisEntity = filterQueryResultByQueryKey(
//         allAssociatedQueryResults,
//         entity,
//         entityType,
//         queryResponseKey,
//         Logger
//       );

//       const sortedQueryResultsForThisEntity = sortQueryResults(
//         queryResults,
//         queryResultForThisEntity,
//         queryResponseKey,
//         Logger
//       );

//       return {
//         ...agg,
//         [queryResponseKey]: sortedQueryResultsForThisEntity,
//         [`${queryResponseKey}MaxResultCount`]: getOr(
//           0,
//           [queryResponseKey, 'maxResultCount'],
//           queryResults
//         )
//       };
//     }, {})
//   )(queryResults);

// const filterQueryResultByQueryKey = (
//   allAssociatedQueryResults,
//   entity,
//   entityType,
//   queryResponseKey,
//   Logger
// ) =>
//   filter((associatedQueryResult) => {
//     const queryKeysForThisEntityType = get([queryResponseKey, entityType], QUERY_KEYS);

//     const entityValueIsAssociatedWithKey = some(
//       (queryKey) =>
//         flow(
//           getOr('', queryKey),
//           toLower,
//           includes(flow(get('value'), toLower)(entity))
//         )(associatedQueryResult),
//       queryKeysForThisEntityType
//     );

//     return entityValueIsAssociatedWithKey;
//   }, allAssociatedQueryResults);

// module.exports = createLookupResults;

const _ = require('lodash');

const getViolationsForThisEntity = require('./getViolationsForThisEntity');
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
  const violations = await processesViolationResponse(
    options,
    responses,
    entity,
    foundIncidents,
    Logger
  );

  Logger.trace({ RESPONSE: 777777777777, violations });

  const apiData = {
    ...violations
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
  const associatedUsers = getAssociatedUsers(responses.violation.value, Logger); // need to take the nested array

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
  // need to write conditions
  Logger.trace({ VIOLATIONS: apiData });
  return apiData.violations
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

// const createSummaryTags = (queryResultsForThisEntity, associatedUsers) => {
//   const countSummarytags = flow(
//     keys,
//     filter((key) => size(queryResultsForThisEntity[key])),
//     map((key) => `${capitalize(key)}: ${size(queryResultsForThisEntity[key])}`)
//   )(queryResultsForThisEntity);

//   const associatedUsersTag = size(associatedUsers)
//     ? `Associated Users: ${size(associatedUsers)}`
//     : [];

//   return [].concat(countSummarytags).concat(associatedUsersTag);
// };

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
