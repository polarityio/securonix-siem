const { get } = require('lodash/fp');
const { TIME_FOR_TOKEN_DAYS } = require('./constants');

const parseErrorToReadableJSON = (error) =>
  JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error)));

const MAX_AUTH_RETRIES = 3;

const getAuthToken = async (
  { username, password, baseUrl, 'User-Agent': userAgent },
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
          password,
          'User-Agent': userAgent,
          validity: TIME_FOR_TOKEN_DAYS
        }
      })
    );
  } catch (error) {
    Logger.error(error, 'Error fetching auth token');
    const err = parseErrorToReadableJSON(error);

    const { status } = err;

    if (status === 403 && retriesLeft) {
      return await getAuthToken(
        { username, password, baseUrl },
        requestWithDefaults,
        tokenCache,
        Logger,
        retriesLeft - 1
      );
    } else {
      // Couldn't get a token so throw the error
      throw error;
    }
  }

  if (newToken) tokenCache.set(authCacheKey, newToken);

  return newToken;
};

module.exports = getAuthToken;
