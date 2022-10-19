const { parallelLimit } = require('async');
const m = require('moment');
const { get, map } = require('lodash/fp');
const getQueryStringsForThisEntity = require('./buildViolationQueryParams');
const { QUERY_KEYS } = require('./constants');

// returns an array of event objects
const getViolationResponse = async (entity, options, requestsInParallel, Logger) => {
  try {
    const { violation } = QUERY_KEYS;
    const type = await transformType(entity);
    const ViolationKeys = violation[type];

    const violationRequestsOptions = map(
      (queryKey) => ({
        uri: `${options.url}/Snypr/ws/spotter/index/search?query=index=violation AND ${queryKey}=${entity.value}`,
        headers: {
          username: options.username,
          password: options.password,
          baseUrl: options.url
        },
        qs: _getTimeframeParams(options.monthsBack),
        json: true
      }),
      ViolationKeys
    );

    const violationResults = await requestsInParallel(
      violationRequestsOptions,
      'body.events'
    );

    Logger.trace({ violationResults }, 'Violation Results');
    return violationResults.flat(); //would like to return this without calling flat().
  } catch (err) {
    throw err;
  }
};

const transformType = async (entity) => {
  if (entity.isIP) return 'ip';
  if (entity.isDomain) return 'domain';
  if (entity.isEmail) return 'email';
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
