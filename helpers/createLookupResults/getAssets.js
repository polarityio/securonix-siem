const { map, flatten } = require('lodash/fp');
const { QUERY_KEYS } = require('../constants');

const parseErrorToReadableJSON = (error) =>
  JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error)));

const getAssets = async (entity, options, requestsInParallel, Logger) => {
  try {
    const { asset } = QUERY_KEYS;
    const userKeys = asset[entity.transformedEntityType];

    const requestOptions = map(
      (queryKey) => ({
        uri: `${options.url}/Snypr/ws/spotter/index/search`,
        headers: {
          username: options.username,
          password: options.password,
          baseUrl: options.url
        },
        qs: {
          query: `index=asset AND ${queryKey}=${entity.value}`
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

    return flatten(assetResponse);
  } catch (error) {
    const err = parseErrorToReadableJSON(error);
    Logger.error({ ERR: err });
    throw err;
  }
};

module.exports = getAssets;
