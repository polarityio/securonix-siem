const { get } = require('lodash/fp');
const buildViolationQueryParams = require('../buildViolationQueryParams');

const getTpi = async (entityGroups, options, requestWithDefaults, Logger) => {
  try {
    const response = await requestWithDefaults({
      uri: `${options.url}/Snypr/ws/spotter/index/search`,
      headers: {
        username: options.username,
        password: options.password,
        baseUrl: options.url
      },
      qs: buildViolationQueryParams(entityGroups, 'tpi', Logger),
      json: true
    });
    Logger.trace({ response }, 'Tpi response');

    return get('body.events', response);
  } catch (err) {
    Logger.error({ ERR: err }, 'error in tpi request');
    throw err;
  }
};

module.exports = getTpi;
