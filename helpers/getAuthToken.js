const { TIME_FOR_TOKEN_DAYS } = require('./constants');

const getAuthToken = async (
  { username, password, baseUrl },
  requestWithDefaults,
  tokenCache,
  Logger
) => {
  const authCacheKey = `${username}${password}`;

  const cachedToken = tokenCache.get(authCacheKey);
  Logger.trace({ username, password, baseUrl, cachedToken });
  Logger.trace({ CACHED_TOKEN: cachedToken });
  if (cachedToken) return cachedToken;

  const { body: newToken } = await requestWithDefaults({
    uri: `${baseUrl}/Snypr/ws/token/generate`,
    headers: {
      'Content-Type': 'application/json',
      username,
      password,
      validity: TIME_FOR_TOKEN_DAYS
    }
  }).then((result) => result || { body: null });

  if (newToken) tokenCache.set(authCacheKey, newToken);

  Logger.trace({ TOKEN: newToken });
  return newToken;
};

module.exports = getAuthToken;
