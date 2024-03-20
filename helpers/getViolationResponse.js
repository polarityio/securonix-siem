const m = require('moment');
const { map, flatten } = require('lodash/fp');
const { QUERY_KEYS } = require('./constants');

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
          ..._getTimeframeParams(options.daysBack),
          query: `index=violation AND ${queryKey}=${entity.value}`
        },
        json: true
      }),
      ViolationKeys
    );

    Logger.debug({ violationRequestsOptions }, 'getViolationResponse Request Options');

    const violationResults = await requestsInParallel(
      violationRequestsOptions,
      'body.events',
      10,
      Logger
    );

    return flatten(violationResults);
  } catch (err) {
    throw err;
  }
};
const _getTimeframeParams = (daysBack) => ({
  generationtime_from: m
    .utc()
    .subtract(Math.abs(daysBack * 24), 'hours')
    .format('MM/DD/YYYY HH:mm:ss'),
  generationtime_to: m.utc().format('MM/DD/YYYY HH:mm:ss')
});

module.exports = getViolationResponse;
