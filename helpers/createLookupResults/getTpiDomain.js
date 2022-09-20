const _ = require('lodash');

const getTpiDomain = async (options, entity, requestWithDefaults, Logger) => {
  try {
    const response = await requestWithDefaults({
      uri: `${options.url}/Snypr/ws/spotter/index/search?query=index=tpi AND tpi_domain=${entity.value}`,
      headers: {
        username: options.username,
        password: options.password,
        baseUrl: options.url
      },
      json: true
    });

    Logger.trace({ TPI_RESPONSE: response });
    return {
      tpiDomain: response.body.events,
      tpiDomainCount: _.size(response.body.events)
    };
  } catch (err) {
    Logger.trace({ ERR: err });
    throw err;
  }
};

module.exports = getTpiDomain;
