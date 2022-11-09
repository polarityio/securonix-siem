const _ = require('lodash');

const createLookupResults = require('./createLookupResults/index');
const getViolationResponse = require('./getViolationResponse');
const getIncidents = require('./getIncidents');
const getUsersByEmail = require('./createLookupResults/getUsersByEmail');
const getTpi = require('./createLookupResults/getTpi');
const getRiskHistory = require('./createLookupResults/getRiskHistory');
const getAssets = require('./createLookupResults/getAssests');

const getLookupResults = async (entity, options, requestFunctions, Logger) => {
  const incidents = options.searchIncidents
    ? await getIncidents(entity, options, requestFunctions.requestsInParallel, Logger)
    : {};
  Logger.trace({ incidents }, 'incidents response');

  const violations = await getViolationResponse(
    entity,
    options,
    requestFunctions.requestsInParallel,
    Logger
  );
  Logger.trace({ violations }, 'violations response');

  const users = await getUsersByEmail(
    entity,
    options,
    requestFunctions.requestsInParallel,
    Logger
  );
  Logger.trace({ users }, 'users response');

  const tpi = await getTpi(entity, options, requestFunctions.requestsInParallel, Logger);
  Logger.trace({ tpi }, 'tpi response');

  const assets = await getAssets(
    entity,
    options,
    requestFunctions.requestsInParallel,
    Logger
  );
  Logger.trace({ assets }, 'assets response');

  const riskscore = await getRiskHistory(
    entity,
    options,
    requestFunctions.requestsInParallel,
    Logger
  );
  Logger.trace({ riskscore }, 'riskscore response');

  const responses = {
    violation: {
      value: violations,
      direction: 'desc',
      key: 'violationCount'
    },
    incidents: {
      value: incidents,
      direction: 'desc',
      key: 'incidentsCount'
    },
    tpi: {
      value: tpi,
      direction: 'desc',
      key: 'tpiIpCount'
    },
    users: {
      value: users,
      direction: 'desc',
      key: 'usersCount'
    },
    riskscore: {
      value: riskscore,
      direction: 'desc',
      key: 'riskscoreCount'
    },
    assets: {
      value: assets,
      direction: 'desc',
      key: 'usersCount'
    }
  };

  const lookupResults = await createLookupResults(responses, entity, incidents, Logger);

  return lookupResults;
};

module.exports = {
  getLookupResults
};
