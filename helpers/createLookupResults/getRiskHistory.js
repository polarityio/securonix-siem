const _ = require('lodash');

const getRiskHistory = async (options, entity, requestWithDefaults, Logger) => {
  try {
    const response = await requestWithDefaults({
      uri: `${options.url}/Snypr/ws/spotter/index/search?query=index=riskscore AND workemail=${entity.value}`,
      headers: {
        username: options.username,
        password: options.password,
        baseUrl: options.url
      },
      json: true
    });

    Logger.trace({ RISKS: response });
    return {
      risks: response.body.events,
      riskCount: _.size(response.body.events)
    };
  } catch (err) {
    Logger.trace({ ERR: err });
    throw err;
  }
};

module.exports = getRiskHistory;
