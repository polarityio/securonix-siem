const buildViolationQueryParams = require("./buildViolationQueryParams");

const getViolationResponse = (entityGroups, options, requestWithDefaults, Logger) =>
  requestWithDefaults({
    uri: `${options.url}/Snypr/ws/spotter/index/search`,
    headers: {
      username: options.username,
      password: options.password,
      baseUrl: options.url
    },
    qs: buildViolationQueryParams(entityGroups, options.monthsBack),
    json: true
  })
    .then(_checkForInternalSecuronixError(Logger))
    .catch((error) => {
      Logger.error({ error }, 'Violation Query Error');
      throw error;
    });

const _checkForInternalSecuronixError = (Logger) => (response) => {
  const {
    body: { error, errorMessage }
  } = response;
  Logger.trace({ error, errorMessage, response }, 'Get Violations Request');
  if (error || errorMessage) {
    const internalSecuronixError = Error('Internal Securonix Query Error');
    internalSecuronixError.status = 'internalSecuronixError';
    internalSecuronixError.description = errorMessage || error;
    throw internalSecuronixError;
  }
  return response;
};

module.exports = getViolationResponse;
