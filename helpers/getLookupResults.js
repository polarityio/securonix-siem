const _ = require('lodash');
const Aigle = require('aigle');
const _P = Aigle.mixin(_);
const { map } = require('lodash');

const IGNORED_IPS = new Set(['127.0.0.1', '255.255.255.255', '0.0.0.0']);
const createLookupResults = require('./createLookupResults/index');
const getViolationResponse = require('./getViolationResponse');
const getIncidents = require('./getIncidents');
const getUsersByEmail = require('./createLookupResults/getUsersByEmail');
const getTpi = require('./createLookupResults/getTpi');
const getRiskHistory = require('./createLookupResults/getRiskHistory');
const getAssets = require('./createLookupResults/getAssests');
const utils = require('util');

const getLookupResults = async (entity, options, requestFunctions, Logger) => {
  Logger.trace({
    FUNC: 1231231231321,
    requestFunctions: utils.inspect(requestFunctions)
  });
  // const entityGroups = _groupEntities(entitiesPartition, options);
  // if (_.isEmpty(entityGroups)) return [];

  // const incidents = options.searchIncidents
  //   ? await getIncidents(entitiesPartition, options, requestFunctions, Logger)
  //   : {};
  // Logger.trace({ incidents }, 'incidents response');
  const incidents = [];
  const users = [];
  const tpi = [];
  const assets = [];
  const riskscore = [];

  const violations = await getViolationResponse(
    entity,
    options,
    requestFunctions.requestsInParallel,
    Logger
  );
  Logger.trace({ violations }, 'violations response');

  // const users = await getUsersByEmail(
  //   entityGroups,
  //   options,
  //   requestWithDefaults,
  //   Logger
  // );
  // Logger.trace({ users }, 'users response');

  // const tpi = await getTpi(entityGroups, options, requestWithDefaults, Logger);
  // Logger.trace({ tpi }, 'tpi response');

  // const assets = await getAssets(entityGroups, options, requestWithDefaults, Logger);
  // Logger.trace({ assets }, 'assets response');

  // const riskscore = await getRiskHistory(
  //   entityGroups,
  //   options,
  //   requestWithDefaults,
  //   Logger
  // );
  // Logger.trace({ riskscore }, 'riskscore response');

  if (!(violations || users || incidents || tpi || riskscore || assets))
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
    riskscore: {
      value: riskscore,
      direction: 'desc',
      key: 'riskscoreCount',
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
    entity,
    incidents,
    Logger
  );

  Logger
  return lookupResults;
};

module.exports = {
  getLookupResults
};
