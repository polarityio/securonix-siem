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
  // Logger.trace({ ASDASDASDAS: 1231231231312 });
  const queryResultsForThisEntity = getQueryResultsForThisEntity(
    queryResults,
    entity,
    entityGroupType,
    Logger
  );

  Logger.trace({ MADE_IT_HERE: 22222222, queryResultsForThisEntity });

  // Logger.trace({ QUERY_RES_ENT: queryResultsForThisEntity });
  const associatedUsers = getAssociatedUsers(
    queryResultsForThisEntity.violations,
    Logger
  );
  // Logger.trace({ QUERY_RES_ENT: 12312313212, queryResultsForThisEntity });

  const violations = getViolations(
    associatedUsers,
    queryResultsForThisEntity.violations,
    entityGroupType
  );

  Logger.trace({ QUERY_RES_ENT: 188888888, queryResultsForThisEntity });

  const queryResultsAreFound = some(size, queryResultsForThisEntity);

  // Logger.trace({ QUERY_RESULT: 3333333, queryResults });
  // Logger.trace({ QUERY_RESULT: 999999, queryResultsForThisEntity, queryResultsAreFound });

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
      Logger.trace({ IN_QUERY_KEY: 111111, queryResultsForThisKey });

      const allAssociatedQueryResults = getObjectsContainingString(
        entity.value,
        get('value', queryResultsForThisKey),
        Logger
      );

      Logger.trace({ IN_GETQUERY: 222222, allAssociatedQueryResults });

      const queryResultForThisEntity = filterQueryResultByQueryKey(
        allAssociatedQueryResults,
        entity,
        entityType,
        queryResponseKey,
        Logger
      );
      Logger.trace({ IN_GETQUERY: 33333333, queryResultForThisEntity });

      // Logger.trace({
      //   QUERY_RESULT_FOR_THIS_ENTITY: 77777777777,
      //   queryResultForThisEntity
      // });

      const sortedQueryResultsForThisEntity = sortQueryResults(
        queryResults,
        queryResultForThisEntity,
        queryResponseKey,
        Logger
      );
      // Logger.trace({ IN_GETQUERY: 44444 });

      // Logger.trace({ SORTED: 100000000, sortedQueryResultsForThisEntity });

      // Logger.trace({
      //   QUERY_RESULT: 11111111,
      //   queryResponseKey,
      //   ALL_ASSOC: 222222,
      //   allAssociatedQueryResults,
      //   Q_RESULT_FOR_ENT: 33333,
      //   queryResultForThisEntity,
      //   SORTED: 4444444,
      //   sortedQueryResultsForThisEntity,
      //   AGG: 555555,
      //   agg
      // });

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
    // Logger.trace({ ENTITY: entity })
    Logger.trace({ All_ASSOCIATED_QUERY: 96767676767676, allAssociatedQueryResults });
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
  Logger.trace({
    SORTED_QUERY_RESULTS: 88888888888888888888,
    queryResults,
    sortedQueryResults,
    queryResultForThisEntity
  });

  const sortedLimitedResults = slice(0, maxResultCount, sortedQueryResults);

  Logger.trace({
    SORTED_QUERY_RESULTS: 99999999999999,
    sortedLimitedResults
  });

  // Logger.trace({
  //   SORTED_QUERY_RESULTS: 88888888888888888888,
  //   queryResults,
  //   queryResponseKey,
  //   direction,
  //   key,
  //   maxResultCount,
  //   sortQueryResults,
  //   sortedLimitedResults
  // });

  return sortedLimitedResults;
};

module.exports = createLookupResults;
