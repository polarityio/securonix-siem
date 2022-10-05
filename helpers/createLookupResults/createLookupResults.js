const _ = require('lodash');
const {
  flow,
  keys,
  some,
  size,
  get,
  reduce,
  orderBy,
  slice,
  capitalize,
  filter,
  toLower,
  getOr,
  includes,
  map
} = require('lodash/fp');

const getViolationsForThisEntity = require('./getViolationsForThisEntity');
const getAssociatedUsers = require('./getAssociatedUsers');
const getViolations = require('./getViolations');
const { getObjectsContainingString } = require('../dataTransformations');

const { QUERY_SORT_KEYS, QUERY_KEYS } = require('../constants');

const createLookupResults = async (options, queryResults, entityGroups, Logger) =>
  _.flatMap(entityGroups, (groupEntities, entityGroupType) =>
    groupEntities.map(
      _aggregateAndProcessResponses(options, queryResults, entityGroupType, Logger)
    )
  );

const _aggregateAndProcessResponses = (
  options,
  queryResults,
  entityGroupType,
  Logger
) => (entity) => {
  const queryResultsForThisEntity = getQueryResultsForThisEntity(
    queryResults,
    entity,
    entityGroupType,
    Logger
  );

  const associatedUsers = getAssociatedUsers(queryResultsForThisEntity.violation, Logger);

  const violations = getViolations(
    associatedUsers,
    queryResultsForThisEntity.violation,
    entityGroupType
  );

  const queryResultsAreFound = some(size, queryResultsForThisEntity);

  return {
    entity,
    data: queryResultsAreFound
      ? {
          summary: createSummaryTags(queryResultsForThisEntity, associatedUsers),
          details: {
            ...queryResultsForThisEntity,
            violations,
            associatedUsers
          }
        }
      : null
  };
};

const getQueryResultsForThisEntity = (queryResults, entity, entityType, Logger) =>
  flow(
    keys,
    reduce((agg, queryResponseKey) => {
      const queryResultsForThisKey = get(queryResponseKey, queryResults);
      const allAssociatedQueryResults = getObjectsContainingString(
        entity.value,
        get('value', queryResultsForThisKey),
        Logger
      );

      const queryResultForThisEntity = filterQueryResultByQueryKey(
        allAssociatedQueryResults,
        entity,
        entityType,
        queryResponseKey,
        Logger
      );

      const sortedQueryResultsForThisEntity = sortQueryResults(
        queryResults,
        queryResultForThisEntity,
        queryResponseKey,
        Logger
      );

      return {
        ...agg,
        [queryResponseKey]: sortedQueryResultsForThisEntity,
        [`${queryResponseKey}MaxResultCount`]: getOr(
          0,
          [queryResponseKey, 'maxResultCount'],
          queryResults
        )
      };
    }, {})
  )(queryResults);

const filterQueryResultByQueryKey = (
  allAssociatedQueryResults,
  entity,
  entityType,
  queryResponseKey,
  Logger
) =>
  filter((associatedQueryResult) => {
    const queryKeysForThisEntityType = get([queryResponseKey, entityType], QUERY_KEYS);

    const entityValueIsAssociatedWithKey = some(
      (queryKey) =>
        flow(
          getOr('', queryKey),
          toLower,
          includes(flow(get('value'), toLower)(entity))
        )(associatedQueryResult),
      queryKeysForThisEntityType
    );

    Logger.trace({
      ASSOCIATED_QUERY_RESULT: 44444,
      associatedQueryResult,
      allAssociatedQueryResults,
      queryResponseKey,
      entityType,
      queryKeysForThisEntityType,
      entityValueIsAssociatedWithKey,
      entity
    });

    return entityValueIsAssociatedWithKey;
  }, allAssociatedQueryResults);

const createSummaryTags = (queryResultsForThisEntity, associatedUsers) => {
  const countSummarytags = flow(
    keys,
    filter((key) => size(queryResultsForThisEntity[key])),
    map((key) => `${capitalize(key)}: ${size(queryResultsForThisEntity[key])}`)
  )(queryResultsForThisEntity);

  const associatedUsersTag = size(associatedUsers)
    ? `Associated Users: ${size(associatedUsers)}`
    : [];

  return [].concat(countSummarytags).concat(associatedUsersTag);
};

const sortQueryResults = (
  queryResults,
  queryResultForThisEntity,
  queryResponseKey,
  Logger
) => {
  const { direction, key, maxResultCount } = getOr({}, queryResponseKey, queryResults);
  const sortedQueryResults = orderBy(key, direction, queryResultForThisEntity);
  const sortedLimitedResults = slice(0, maxResultCount, sortedQueryResults);
  return sortedLimitedResults;
};

module.exports = createLookupResults;
