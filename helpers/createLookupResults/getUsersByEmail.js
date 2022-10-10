const { get } = require('lodash/fp');
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
      qs: buildViolationQueryParams(entityGroups, 'users', Logger),
      json: true
    });
    Logger.trace({ response }, 'getUsersByEmail response');

    return get('body.events', response);
  } catch (err) {
    Logger.error({ ERR: err });
    throw err;
  }
};

module.exports = getUsersByEmail;
