const { get } = require('lodash/fp');
const buildViolationQueryParams = require('../buildViolationQueryParams');

const getRiskHistory = async (entityGroups, options, requestWithDefaults, Logger) => {
  try {
    const response = await requestWithDefaults({
      uri: `${options.url}/Snypr/ws/spotter/index/search?query=index=riskscorehistory`,
      headers: {
        username: options.username,
        password: options.password,
        baseUrl: options.url
      },
      // qs: buildViolationQueryParams(entityGroups, 'riskscore', Logger),
      json: true
    });
    Logger.trace({ response }, 'getRiskHistory response');

    return get('body.events', response);
  } catch (err) {
    Logger.trace({ ERR: err });
    throw err;
  }
};

module.exports = getRiskHistory;
