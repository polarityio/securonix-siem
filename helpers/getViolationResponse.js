const _ = require('lodash');
const buildViolationQueryParams = require('./buildViolationQueryParams');

const getViolationResponse = async (
  entityGroups,
  options,
  requestWithDefaults,
  Logger
) => {
  try {
    const response = await requestWithDefaults({
      uri: `${options.url}/Snypr/ws/spotter/index/search`,
      headers: {
        username: options.username,
        password: options.password,
        baseUrl: options.url
      },
      qs: buildViolationQueryParams(
        entityGroups,
        options.monthsBack,
        'violation',
        Logger
      ),
      json: true
    });

    Logger.trace({ RESPONSE: 222222222222, response });

    return response.body;
  } catch (err) {
    Logger.error({ TEST: 1231231231, err });
    throw err;
  }
};

module.exports = getViolationResponse;
