const { map } = require('lodash/fp');
const { QUERY_KEYS } = require('../constants');

const getUsersByEmail = async (entity, options, requestsInParallel, Logger) => {
  try {
    const { users } = QUERY_KEYS;
    const userKeys = users[entity.transformedEntityType];

    const requestOptions = map(
      (queryKey) => ({
        uri: `${options.url}/Snypr/ws/spotter/index/search?query=index=users AND ${queryKey}=${entity.value}`,
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

module.exports = getUsersByEmail;
