const m = require('moment');
const { map } = require('lodash/fp');
const { QUERY_KEYS } = require('./constants');

// lodash/fp - flatten

const getViolationResponse = async (entity, options, requestsInParallel, Logger) => {
  try {
    const { violation } = QUERY_KEYS;
    const ViolationKeys = violation[entity.transformedEntityType];

    const violationRequestsOptions = map(
      (queryKey) => ({
        uri: `${options.url}/Snypr/ws/spotter/index/search`,
        headers: {
          username: options.username,
          password: options.password,
          baseUrl: options.url
        },
        qs: {
          ..._getTimeframeParams(options.monthsBack),
          query: `index=violation AND ${queryKey}=${entity.value}`
        },
        json: true
      }),
      ViolationKeys
    );

    const violationResults = await requestsInParallel(
      violationRequestsOptions,
      'body.events',
      10,
      Logger
    );

    Logger.trace({ violationResults }, 'Violation Results');
    return violationResults.flat(); //would like to return this without calling flat().
  } catch (err) {
    throw err;
  }
};

const _getTimeframeParams = (monthsBack, dateTo) => ({
  generationtime_from: m
    .utc(dateTo)
    .subtract(Math.floor(Math.abs(monthsBack)), 'months')
    .subtract((Math.abs(monthsBack) % 1) * 30.41, 'days')
    .format('MM/DD/YYYY HH:mm:ss'),
  generationtime_to: m.utc(dateTo).format('MM/DD/YYYY HH:mm:ss')
});

module.exports = getViolationResponse;
