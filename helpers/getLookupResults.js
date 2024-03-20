const async = require('async');

const createLookupResults = require('./createLookupResults/index');
const getViolationResponse = require('./getViolationResponse');
const getUsersByEmail = require('./createLookupResults/getUsersByEmail');
const getTpi = require('./createLookupResults/getTpi');
const getRiskHistory = require('./createLookupResults/getRiskHistory');
const getActivity = require('./createLookupResults/getActivity');
// const getAssets = require('./createLookupResults/getAssets');

const categoryToFunc = {
  violations: getViolationResponse,
  users: getUsersByEmail,
  tpi: getTpi,
  riskscore: getRiskHistory,
  activity: getActivity
};

const getLookupResults = async (entity, options, requestFunctions, Logger) => {
  const searches = {};

  options.searchCategories.forEach((category) => {
    searches[category.value] = async () =>
      categoryToFunc[category.value](
        entity,
        options,
        requestFunctions.requestsInParallel,
        Logger
      );
  });

  const { violations, tpi, users, riskscore, activity } = await async.parallel(searches);

  // `direction` is the sort direction for the data
  // `key` is the key that the data is sorted on
  // If not provided the data is not sorted
  const responses = {
    violations: {
      value: violations ? violations : [],
      direction: 'desc',
      key: 'violationCount' // key is the sort key
    },
    tpi: {
      value: tpi ? tpi : [],
      direction: 'desc', // direction is the
      key: 'tpiIpCount' // key is the sort key
    },
    users: {
      value: users ? users : []
    },
    riskscore: {
      value: riskscore ? riskscore : [],
      direction: 'desc',
      key: 'riskscore' // key is the sort key
    },
    activity: {
      value: activity ? activity : {}
    }
    // assets: {
    //   value: assets,
    //   direction: 'desc',
    //   key: 'usersCount'
    // }
  };

  const lookupResults = createLookupResults(responses, entity, Logger);

  return lookupResults;
};

module.exports = {
  getLookupResults
};
