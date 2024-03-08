const m = require('moment');
const { map, flatten } = require('lodash/fp');
const { QUERY_KEYS } = require('../constants');

const parseErrorToReadableJSON = (error) =>
  JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error)));

const getActivity = async (entity, options, requestsInParallel, Logger) => {
  try {
    const { activity } = QUERY_KEYS;
    const activityKeys = activity[entity.transformedEntityType];

    const requestOptions = map(
      (queryKey) => ({
        uri: `${options.url}/Snypr/ws/spotter/index/search`,
        headers: {
          username: options.username,
          password: options.password,
          baseUrl: options.url
        },
        qs: {
          ..._getTimeframeParams(options.eventsDaysBack),
          query: `index=activity AND ${queryKey}="${entity.value}" AND ${options.activitySearchFilter}`,
          max: 1
        },
        method: 'GET',
        json: true
      }),
        activityKeys
    );

    Logger.debug({ requestOptions }, 'getEvents Request Options');

    const eventResponse = await requestsInParallel(
      requestOptions,
      'body.events',
      10,
      Logger
    );

    //Logger.info({ eventResponse }, 'Event Response');

    return flatten(eventResponse);
  } catch (error) {
    const err = parseErrorToReadableJSON(error);
    Logger.error({ ERR: err });
    throw err;
  }
};

const _getTimeframeParams = (daysBack) => ({
  eventtime_from: m
    .utc()
    .subtract(Math.abs(daysBack * 24), 'hours')
    .format('MM/DD/YYYY HH:mm:ss'),
  eventtime_to: m.utc().format('MM/DD/YYYY HH:mm:ss')
});

module.exports = getActivity;
