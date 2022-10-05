const _ = require('lodash');
const Aigle = require('aigle');
const _P = Aigle.mixin(_);

const IGNORED_IPS = new Set(['127.0.0.1', '255.255.255.255', '0.0.0.0']);
const createLookupResults = require('./createLookupResults/index');
const getViolationResponse = require('./getViolationResponse');
const getIncidents = require('./getIncidents');
const getUsersByEmail = require('./createLookupResults/getUsersByEmail');
// const getTpiDomain = require('./getTpiDomain');
// const getAssets = require('./getAssests');
// const getRiskHistory = require('./getRiskHistory');

const getLookupResults = async (entities, options, requestWithDefaults, Logger) => {
  return _partitionFlatMap(
    async (entitiesPartition) => {
      const entityGroups = _groupEntities(entitiesPartition, options);

      if (_.isEmpty(entityGroups)) return [];

      // const incidents = options.searchIncidents
      //   ? getIncidents(entitiesPartition, options, requestWithDefaults, Logger)
      //   : {};

      // const violations = await getViolationResponse(
      //   entityGroups,
      //   options,
      //   requestWithDefaults,
      //   Logger
      // );

      const users = await getUsersByEmail(
        entityGroups,
        options,
        requestWithDefaults,
        Logger
      );

      const incidents = [];
      const violations = [];
      // const tpiDomainsResponse = await getTpiDomain(
      //   options,
      //   entityGroups,
      //   requestWithDefaults,
      //   Logger
      // );
      // const assetsResponse = await getAssets(
      //   options,
      //   entityGroups,
      //   requestWithDefaults,
      //   Logger
      // );
      // const riskHistoryResponse = await getRiskHistory(
      //   options,
      //   entityGroups,
      //   requestWithDefaults,
      //   Logger
      // );

      if (!(violations || users || incidents))
        return map(entitiesPartition, (entity) => ({ entity, data: null }));

      Logger.trace({ violations }, 'Violation Response');

      const responses = {
        violation: {
          value: violations,
          direction: 'desc',
          key: 'violationCount',
          maxResultCount: 40
        },
        incidents: {
          value: incidents,
          direction: 'desc',
          key: 'violationCount',
          maxResultCount: 40
        },
        // tpiDomainsResponse,
        users: {
          value: users,
          direction: 'desc',
          key: 'violationCount',
          maxResultCount: 40
        }
        // assetsResponse,
        // riskHistoryResponse
      };

      const lookupResults = await createLookupResults(
        options,
        responses,
        entityGroups,
        Logger
      );

      Logger.trace({ LOOKUP_RESULTS: lookupResults });
      return lookupResults;
    },
    10,
    entities
  );
};

const _partitionFlatMap = (func, partitionSize, collection, parallelLimit = 10) =>
  _P
    .chain(collection)
    .chunk(partitionSize)
    .map((x) => async () => func(x))
    .thru((x) => Aigle.parallelLimit(x, parallelLimit))
    .flatten()
    .value();

const _groupEntities = (entities, options) =>
  _.chain(entities)
    .filter(({ isIP, value }) => !isIP || (isIP && !IGNORED_IPS.has(value)))
    .groupBy(({ isIP, isDomain, isEmail, type, types }) =>
      isIP
        ? 'ip'
        : isDomain
        ? 'domain'
        : isEmail
        ? 'email'
        : type === 'string' && options.searchForEmployeeId
        ? 'string'
        : type === 'custom' && types.indexOf('custom.username') >= 0
        ? 'username'
        : type === 'custom' && types.indexOf('custom.hostname') >= 0
        ? 'hostname'
        : 'unknown'
    )
    .omit('unknown')
    .value();

module.exports = {
  getLookupResults,
  _groupEntities
};
