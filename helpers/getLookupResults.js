const _ = require('lodash');
const Aigle = require('aigle');
const _P = Aigle.mixin(_);

const IGNORED_IPS = new Set(['127.0.0.1', '255.255.255.255', '0.0.0.0']);
const createLookupResults = require('./createLookupResults/index');
const getViolationResponse = require('./getViolationResponse');
const getIncidents = require('./getIncidents');
const getUsersByEmail = require('./createLookupResults/getUsersByEmail');
const getTpi = require('./createLookupResults/getTpi');
const getRiskHistory = require('./createLookupResults/getRiskHistory');
const getAssets = require('./createLookupResults/getAssests');

const getLookupResults = async (entities, options, requestWithDefaults, Logger) => {
  return _partitionFlatMap(
    async (entitiesPartition) => {
      const entityGroups = _groupEntities(entitiesPartition, options);

      if (_.isEmpty(entityGroups)) return [];

      const incidents = options.searchIncidents
        ? getIncidents(entitiesPartition, options, requestWithDefaults, Logger)
        : {};
      Logger.trace({ incidents }, 'incidents response');

      const violations = await getViolationResponse(
        entityGroups,
        options,
        requestWithDefaults,
        Logger
      );
      Logger.trace({ violations }, 'violations response');

      const users = await getUsersByEmail(
        entityGroups,
        options,
        requestWithDefaults,
        Logger
      );
      Logger.trace({ users }, 'users response');

      const tpi = await getTpi(options, entityGroups, requestWithDefaults, Logger);
      Logger.trace({ tpi }, 'tpi response');

      const assets = await getAssets(entityGroups, options, requestWithDefaults, Logger);
      Logger.trace({ assets }, 'assets response');

      const riskHistory = await getRiskHistory(
        options,
        entityGroups,
        requestWithDefaults,
        Logger
      );
      Logger.trace({ riskHistory }, 'riskHistory response');

      if (!(violations || users || incidents || tpi || riskHistory || assets))
        return map(entitiesPartition, (entity) => ({ entity, data: null }));

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
          key: 'incidentsCount',
          maxResultCount: 40
        },
        tpi: {
          value: tpi,
          direction: 'desc',
          key: 'tpiIpCount',
          maxResultCount: 40
        },
        users: {
          value: users,
          direction: 'desc',
          key: 'usersCount',
          maxResultCount: 40
        },
        riskhistory: {
          value: riskHistory,
          direction: 'desc',
          key: 'riskHistoryCount',
          maxResultCount: 40
        },
        assets: {
          value: assets,
          direction: 'desc',
          key: 'usersCount',
          maxResultCount: 40
        }
      };

      const lookupResults = await createLookupResults(
        options,
        responses,
        entityGroups,
        Logger
      );

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
