const { get } = require('lodash/fp');
const m = require('moment');
const buildViolationQueryParams = require('./buildViolationQueryParams');

const getViolationResponse = async (
  entityGroups,
  options,
  requestWithDefaults,
  Logger
) => {
  try {
    const params = buildViolationQueryParams(entityGroups, 'violation', Logger);
    
    const response = await requestWithDefaults({
      uri: `${options.url}/Snypr/ws/spotter/index/search`,
      headers: {
        username: options.username,
        password: options.password,
        baseUrl: options.url
      },
      qs: { ...params, ..._getTimeframeParams(options.monthsBack) },
      json: true
    });
    Logger.trace({ response }, 'getViolation response');

    return get('body.events', response);
  } catch (err) {
    Logger.error({ ERR: err });
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
