const { get } = require('lodash/fp');
const { TIME_FOR_TOKEN_DAYS } = require('./constants');

const parseErrorToReadableJSON = (error) =>
  JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error)));

const MAX_AUTH_RETRIES = 3;

const getAuthToken = async (
  { username, password, baseUrl },
  requestWithDefaults,
  tokenCache,
  Logger,
  retriesLeft = MAX_AUTH_RETRIES
) => {
  const authCacheKey = `${username}${password}`;
  const cachedToken = tokenCache.get(authCacheKey);

  if (cachedToken) return cachedToken;

  let newToken;

  try {
    newToken = get(
      'body',
      await requestWithDefaults({
        uri: `${baseUrl}/Snypr/ws/token/generate`,
        headers: {
          username,
          password
          // validity: TIME_FOR_TOKEN_DAYS
        }
      })
    );
  } catch (error) {
    const err = parseErrorToReadableJSON(error);

    const { status } = err;

    if (status === 403 && retriesLeft)
      return await getAuthToken(
        { username, password, baseUrl },
        requestWithDefaults,
        tokenCache,
        Logger,
        retriesLeft - 1
      );
  }

  if (newToken) tokenCache.set(authCacheKey, newToken);

  return newToken;
};

module.exports = getAuthToken;
