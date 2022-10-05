const m = require('moment');
const _ = require('lodash');
const { QUERY_KEYS } = require('./constants');
const { flow, join, map, flatten, get, compact } = require('lodash/fp');
const mapObj = require('lodash/fp/map').convert({ cap: false });

const buildViolationQueryParams = (entityGroups, monthsBack, index, Logger, dateTo) => {
  return {
    query: _buildSecuronixQuery(entityGroups, index, Logger),
    ..._getTimeframeParams(monthsBack, dateTo)
  };
};

// const _buildSecuronixQuery = (entityGroups, index, Logger) => {
//   const getEntityGroupQueryString = (groupEntities, entityGroupType) =>
//     _.chain(groupEntities)
//       .flatMap(({ value }) => {
//         return QUERY_KEYS[index][entityGroupType].map(
//           (queryKey) => `${queryKey}="${value}"`
//         );
//       })
//       .thru((x) => {
//         return x;
//       })
//       .join(' OR ')
//       .value();

//   return _.chain(entityGroups)
//     .map(getEntityGroupQueryString)
//     .join(' OR ')
//     .thru((unfinishedQuery) => `index=${index} AND (${unfinishedQuery})`)
//     .value();
// };

const _buildSecuronixQuery = (entitiesByEntityType, queryIndex, Logger) =>
  flow(
    mapObj((entities, entityType) =>
      getQueryStringForAllEntitiesOfThisType(entities, entityType, queryIndex, Logger)
    ),
    compact,
    join(' OR '),
    (unfinishedQuery) => {
      const q = `index=${queryIndex} AND (${unfinishedQuery})`;
      Logger.trace({ QUERY: 111111111, q });
      return q;
    }
  )(entitiesByEntityType);

const getQueryStringForAllEntitiesOfThisType = (
  entities,
  entityType,
  queryIndex,
  Logger
) =>
  flow(
    map((entity) => getQueryStringsForThisEntity(entity, entityType, queryIndex, Logger)),
    (x) => {
      Logger.trace({ DATA: x, entityType, queryIndex });
      return x;
    },
    flatten,
    (x) => {
      Logger.trace({ AFTER_FLATTEN: x });
      return x;
    },
    join(' OR ')
  )(entities);

// const getQueryStringsForThisEntity = (entityType) => (entity) =>
const getQueryStringsForThisEntity = (entity, entityType, queryIndex, Logger) =>
  flow(
    (queryKeys) => get([queryIndex, entityType], queryKeys),
    map((queryKeyForThisEntityType) => `${queryKeyForThisEntityType}="${entity.value}"`)
  )(QUERY_KEYS);

const _getTimeframeParams = (monthsBack, dateTo) => ({
  generationtime_from: m
    .utc(dateTo)
    .subtract(Math.floor(Math.abs(monthsBack)), 'months')
    .subtract((Math.abs(monthsBack) % 1) * 30.41, 'days')
    .format('MM/DD/YYYY HH:mm:ss'),
  generationtime_to: m.utc(dateTo).format('MM/DD/YYYY HH:mm:ss')
});

module.exports = buildViolationQueryParams;
