const _ = require('lodash');
const buildViolationQueryParams = require('../buildViolationQueryParams');

const getUsersByEmail = async (entityGroups, options, requestWithDefaults, Logger) => {
  try {
    const response = await requestWithDefaults({
      uri: `${options.url}/Snypr/ws/spotter/index/search`,
      headers: {
        username: options.username,
        password: options.password,
        baseUrl: options.url
      },
      qs: buildViolationQueryParams(entityGroups, options.monthsBack, 'users', Logger),
      json: true
    });

    Logger.trace({ RESPONSE_USER_EMAIL: 3333333, response });

    return _.get(response, 'body.events');
  } catch (err) {
    Logger.error({ TEST: 1231231231, err });
    throw err;
  }
};

module.exports = getUsersByEmail;
