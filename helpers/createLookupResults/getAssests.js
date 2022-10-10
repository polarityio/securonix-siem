const { get } = require('lodash/fp');
const buildViolationQueryParams = require('../buildViolationQueryParams');

const getAssets = async (entityGroups, options, requestWithDefaults, Logger) => {
  try {
    const response = await requestWithDefaults({
      uri: `${options.url}/Snypr/ws/spotter/index/search`,
      headers: {
        username: options.username,
        password: options.password,
        baseUrl: options.url
      },
      qs: buildViolationQueryParams(entityGroups, 'asset', Logger),
      json: true
    });
    Logger.trace({ response }, 'Get Assets response');

    return get('body.events', response);
  } catch (err) {
    Logger.error({ ERR: err });
    throw err;
  }
};

module.exports = getAssets;
