const { get } = require('lodash/fp');
const buildViolationQueryParams = require('./buildViolationQueryParams');

const getViolationResponse = async (
  entityGroups,
  options,
  requestWithDefaults,
  Logger
) => {
  Logger.trace({ ENT_GROUPS: 888888888, entityGroups });
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

    // Logger.trace({ RESPONSE: 222222222222, response });
    Logger.trace({ RESPONSE_CHECK: 222222222222, response });
    // Logger.trace({ BODY: get(response, 'body') });
    // Logger.trace({ EVENTS: get(response, 'body.events') });
    const data = get('body.events', response);
    Logger.trace({ DATA_IN_GET_VIOLATION: 21313131321313212, data });
    return data;
    // return response;
    // return data.body;
  } catch (err) {
    Logger.error({ TEST: 1231231231, err });
    throw err;
  }
};

module.exports = getViolationResponse;
