const { get } = require('lodash/fp');
const buildViolationQueryParams = require('../buildViolationQueryParams');

const getTpi = async (entityGroups, options, requestWithDefaults, Logger) => {
  try {
    const response = await requestWithDefaults({
      uri: `${options.url}/Snypr/ws/spotter/index/search?query=index=tpi AND tpi_ip=99.83.154.118`,
      headers: {
        username: options.username,
        password: options.password,
        baseUrl: options.url
      },
      // qs: buildViolationQueryParams(entityGroups, options.monthsBack, 'tpi', Logger),
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
