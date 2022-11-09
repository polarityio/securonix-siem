const { map, flatten } = require('lodash/fp');
const { QUERY_KEYS } = require('../constants');

const getTpi = async (entity, options, requestsInParallel, Logger) => {
  try {
    const { tpi } = QUERY_KEYS;
    const userKeys = tpi[entity.transformedEntityType];

    const requestOptions = map(
      (queryKey) => ({
        uri: `${options.url}/Snypr/ws/spotter/index/search`,
        headers: {
          username: options.username,
          password: options.password,
          baseUrl: options.url
        },
        qs: {
          query: `index=tpi AND ${queryKey}=${entity.value}`
        },
        json: true
      }),
      userKeys
    );

    const tpiResponse = await requestsInParallel(
      requestOptions,
      'body.events',
      10,
      Logger
    );

    Logger.trace({ tpiResponse }, 'User By Emails Results');
    return flatten(tpiResponse);
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

module.exports = getTpi;
