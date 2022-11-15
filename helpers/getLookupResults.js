const _ = require('lodash');

const createLookupResults = require('./createLookupResults/index');
const getViolationResponse = require('./getViolationResponse');
const getIncidents = require('./getIncidents');
const getUsersByEmail = require('./createLookupResults/getUsersByEmail');
const getTpi = require('./createLookupResults/getTpi');
const getRiskHistory = require('./createLookupResults/getRiskHistory');
const getAssets = require('./createLookupResults/getAssets');
const { compact } = require('lodash/fp');

// ** TODO: make sure users results bring consistent with searching multiple entities - with user email

const getLookupResults = async (entity, options, requestFunctions, Logger) => {
  const violations = await getViolationResponse(
    entity,
    options,
    requestFunctions.requestsInParallel,
    Logger
  );

  // const users = [];
  // const tpi = [];
  // const assets = [];
  // const riskscore = [];
  // const violations = [];

  const users = await getUsersByEmail(
    entity,
    options,
    requestFunctions.requestsInParallel,
    Logger
  );

  const tpi = await getTpi(entity, options, requestFunctions.requestsInParallel, Logger);

  const assets = await getAssets(
    entity,
    options,
    requestFunctions.requestsInParallel,
    Logger
  );

  const riskscore = await getRiskHistory(
    entity,
    options,
    requestFunctions.requestsInParallel,
    Logger
  );

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

  Logger.trace({ RESPONSES: responses });

  const lookupResults = await createLookupResults(responses, entity, Logger);

  return lookupResults;
};

module.exports = {
  getLookupResults
};
