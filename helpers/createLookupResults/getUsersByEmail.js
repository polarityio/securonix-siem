const { map } = require('lodash/fp');
const { QUERY_KEYS } = require('../constants');

const parseErrorToReadableJSON = (error) =>
  JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error)));

const getUsersByEmail = async (entity, options, requestsInParallel, Logger) => {
  try {
    const { users } = QUERY_KEYS;
    const userKeys = users[entity.transformedEntityType];

    const requestOptions = map(
      (queryKey) => ({
        uri: `${options.url}/Snypr/w/spotter/index/search?query=index=users AND ${queryKey}=${entity.value}`,
        headers: {
          username: options.username,
          password: options.password,
          baseUrl: options.url
        },
        json: true
      }),
      userKeys
    );

    const userByEmailResults = await requestsInParallel(
      requestOptions,
      'body.events',
      10,
      Logger
    );

    Logger.trace({ userByEmailResults }, 'User By Emails Results');
    return userByEmailResults.flat(); //would like to return this without calling flat().
  } catch (error) {
    const err = parseErrorToReadableJSON(error);
    Logger.error({ ERR: err });
    throw err;
  }
};

module.exports = getUsersByEmail;
