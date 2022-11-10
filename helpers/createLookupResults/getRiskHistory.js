const { map, flatten } = require('lodash/fp');
const { QUERY_KEYS } = require('../constants');

const getRiskHistory = async (entity, options, requestsInParallel, Logger) => {
  try {
    const { riskscore } = QUERY_KEYS;
    const userKeys = riskscore[entity.transformedEntityType];

    const requestOptions = map(
      (queryKey) => ({
        uri: `${options.url}/Snypr/ws/spotter/index/search`,
        headers: {
          username: options.username,
          password: options.password,
          baseUrl: options.url
        },
        qs: { query: `index=riskscore AND ${queryKey}=${entity.value}` },
        json: true
      }),
      userKeys
    );

    const riskscoreResponse = await requestsInParallel(
      requestOptions,
      'body.events',
      10,
      Logger
    );

    Logger.trace({ riskscoreResponse }, 'Riskscore Results');
    return flatten(riskscoreResponse);
  } catch (err) {
    Logger.error({ ERR: err });
    throw err;
  }
};

module.exports = getRiskHistory;
