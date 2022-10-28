const { map } = require('lodash/fp');
const { QUERY_KEYS } = require('../constants');

const getRiskHistory = async (entity, options, requestsInParallel, Logger) => {
  try {
    const { riskscore } = QUERY_KEYS;
    const userKeys = riskscore[entity.transformedEntityType];

    const requestOptions = map(
      (queryKey) => ({
        uri: `${options.url}/Snypr/ws/spotter/index/search?query=index=riskscore AND ${queryKey}=${entity.value}`,
        headers: {
          username: options.username,
          password: options.password,
          baseUrl: options.url
        },
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
    return riskscoreResponse.flat(); //would like to return this without calling flat().
  } catch (err) {
    Logger.error({ ERR: err });
    throw err;
  }
};

const transformType = async (entity) => {
  if (entity.isIP) return 'ip';
  if (entity.isDomain) return 'domain';
  if (entity.isEmail) return 'email';
};

module.exports = getRiskHistory;
