const createLookupResults = require('./createLookupResults/index');
const getViolationResponse = require('./getViolationResponse');
const getUsersByEmail = require('./createLookupResults/getUsersByEmail');
const getTpi = require('./createLookupResults/getTpi');
const getRiskHistory = require('./createLookupResults/getRiskHistory');
// const getAssets = require('./createLookupResults/getAssets');

const getLookupResults = async (entity, options, requestFunctions, Logger) => {
  const [violations, users, tpi, riskscore, /* assets */] = await Promise.all([
    getViolationResponse(entity, options, requestFunctions.requestsInParallel, Logger),
    getUsersByEmail(entity, options, requestFunctions.requestsInParallel, Logger),
    getTpi(entity, options, requestFunctions.requestsInParallel, Logger),
    getRiskHistory(entity, options, requestFunctions.requestsInParallel, Logger),
    // getAssets(entity, options, requestFunctions.requestsInParallel, Logger)
  ]);

  const responses = {
    violation: {
      value: violations,
      direction: 'desc',
      key: 'violationCount'
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
    // assets: {
    //   value: assets,
    //   direction: 'desc',
    //   key: 'usersCount'
    // }
  };

  Logger.trace({ responses }, 'Responses from lookups');

  const lookupResults = createLookupResults(responses, entity, Logger);

  return lookupResults;
};

module.exports = {
  getLookupResults
};
