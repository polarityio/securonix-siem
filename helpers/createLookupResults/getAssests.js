const { map, flatten } = require('lodash/fp');
const { QUERY_KEYS } = require('../constants');

const getAssets = async (entity, options, requestsInParallel, Logger) => {
  try {
    const { asset } = QUERY_KEYS;
    const userKeys = asset[entity.transformedEntityType];

    const requestOptions = map(
      (queryKey) => ({
        uri: `${options.url}/Snypr/ws/spotter/index/search?query=index=asset AND ${queryKey}=${entity.value}`,
        headers: {
          username: options.username,
          password: options.password,
          baseUrl: options.url
        },
        json: true
      }),
      userKeys
    );

    const assetResponse = await requestsInParallel(
      requestOptions,
      'body.events',
      10,
      Logger
    );

    Logger.trace({ assetResponse }, 'Asset Results');
    return flatten(assetResponse);
  } catch (err) {
    Logger.error({ ERR: err });
    throw err;
  }
};

module.exports = getAssets;
