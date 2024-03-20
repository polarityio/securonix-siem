const m = require('moment');
const { map, flatten } = require('lodash/fp');
const { MAX_ACTIVITY_EVENTS, QUERY_KEYS } = require('../constants');

const parseErrorToReadableJSON = (error) =>
  JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error)));

const getActivity = async (entity, options, requestsInParallel, Logger) => {
  try {
    const { activity } = QUERY_KEYS;
    const activityKeys = activity[entity.transformedEntityType];

    let searchKeyString = activityKeys
      .map((key) => {
        return `${key}="${entity.value}"`;
      })
      .join(' OR ');

    // Wrap in array due to required use of `requestsInParallel`
    const requestOptions = [
      {
        uri: `${options.url}/Snypr/ws/spotter/index/search`,
        headers: {
          username: options.username,
          password: options.password,
          baseUrl: options.url
        },
        qs: {
          ..._getTimeframeParams(options.eventsDaysBack),
          query: `index=activity AND ${options.activitySearchFilter} AND (${searchKeyString})`,
          max: MAX_ACTIVITY_EVENTS
        },
        method: 'GET',
        json: true
      }
    ];
    Logger.debug({ requestOptions }, 'getActivity Request Options');

    // We only ever have a single response but requestsInParallel will always return an array of results
    // so we grab the first result object and return it.
    let [eventResponse] = await requestsInParallel(requestOptions, 'body', 10, Logger);

    if (
      eventResponse &&
      Array.isArray(eventResponse.events) &&
      eventResponse.events.length === 0
    ) {
      return;
    }

    // Securonix REST API currently has a bug where the "max" query parameter has no effect.
    // This has been reported to Securonix.  To prevent too much data from being sent back to
    // the Overlay Window we slice the array here on the server and only return the first 25 results.
    eventResponse.events = eventResponse.events.slice(0, 25);

    // The `rawevent` is a large string that we don't currently use in the template so we remove it
    // to make it easier to render the keys in the template
    eventResponse.events.forEach((event) => {
      delete event.rawevent;
    });

    return eventResponse;
  } catch (error) {
    const err = parseErrorToReadableJSON(error);
    Logger.error({ ERR: err }, 'Error in getActivity() method');
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
