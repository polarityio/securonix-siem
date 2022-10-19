const m = require('moment');
const _ = require('lodash');
const { QUERY_KEYS } = require('./constants');
const { flow, join, map, flatten, get, compact } = require('lodash/fp');
const mapObj = require('lodash/fp/map').convert({ cap: false });

// 1. are we getting duplicates, for simple entity lookup - single lookup. test - do we need duplicate logic?
// 2.

// const buildViolationQueryParams = (entityGroups, index, Logger) => {
//   const query = _buildSecuronixQuery(entityGroups, index, Logger);
//   Logger.trace({ QUERY: query, entityGroups });
//   return {
//     query,
//     max: 5
//   };
// };

// const _buildSecuronixQuery = (entitiesByEntityType, queryIndex, Logger) =>
//   flow(
//     mapObj((entities, entityType) =>
//       getQueryStringForAllEntitiesOfThisType(entities, entityType, queryIndex, Logger)
//     ),
//     compact,
//     join(' OR '),
//     (unfinishedQuery) => {
//       return `index=${queryIndex} AND (${unfinishedQuery})`;
//     }
//   )(entitiesByEntityType);

// const getQueryStringForAllEntitiesOfThisType = (
//   entities,
//   entityType,
//   queryIndex,
//   Logger
// ) =>
//   flow(
//     map((entity) => getQueryStringsForThisEntity(entity, entityType, queryIndex, Logger)),
//     flatten,
//     join(' OR ')
//   )(entities);

const getQueryStringsForThisEntity = (entity, entityType, Logger) =>
  flow(
    (queryKeys) => get([queryIndex, entityType], queryKeys),
    map((queryKeyForThisEntityType) => `${queryKeyForThisEntityType}="${entity.value}"`)
  )(QUERY_KEYS);

module.exports = getQueryStringsForThisEntity;
