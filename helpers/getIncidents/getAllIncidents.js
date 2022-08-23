const m = require('moment');
const { getOr, flow, concat, uniqBy } = require('lodash/fp');

const NodeCache = require('node-cache');
const { INCIDENT_PAGE_SIZE } = require('../constants');

const incidentCache = new NodeCache({
  stdTTL: 60 * 60
});

const getAllIncidents = async (options, requestWithDefaults, Logger) => {
  const allIncidents = incidentCache.get('allIncidents');
  if (allIncidents) return allIncidents;

  let lookBackTime = incidentCache.get(`timeBack${options.monthsBack}`);
  if (!lookBackTime) {
    lookBackTime = m
      .utc()
      .subtract(Math.floor(Math.abs(options.monthsBack)), 'months')
      .subtract((Math.abs(options.monthsBack) % 1) * 30.41, 'days')
      .valueOf();
    incidentCache.set(`timeBack${options.monthsBack}`, lookBackTime);
  }

  const openIncidents = await getAllIncidentsOfRangeType(
    'opened',
    lookBackTime,
    options,
    requestWithDefaults,
    Logger
  );

  const closedIncidents = await getAllIncidentsOfRangeType(
    'closed',
    lookBackTime,
    options,
    requestWithDefaults,
    Logger
  );

  const foundIncidents = flow(
    concat(closedIncidents),
    uniqBy('incidentId')
  )(openIncidents);

  incidentCache.set('allIncidents', foundIncidents);

  return foundIncidents;
};

const getAllIncidentsOfRangeType = async (
  rangeType,
  from,
  options,
  requestWithDefaults,
  Logger,
  allTotalIncidents,
  offset = 0,
  aggIncidents = []
) => {
  const { totalIncidents, incidentItems } = getOr(
    { totalIncidents: 0, incidentItems: [] },
    'body.result.data',
    await requestWithDefaults({
      uri: `${options.url}/Snypr/ws/incident/get`,
      headers: {
        username: options.username,
        password: options.password,
        baseUrl: options.url
      },
      qs: {
        type: 'list',
        rangeType,
        from,
        to: m.utc().valueOf(),
        max: INCIDENT_PAGE_SIZE,
        ...(offset && { offset })
      },
      json: true
    }).then(_checkForInternalSecuronixError(Logger))
  );
  const allIncidentItems = aggIncidents.concat(incidentItems);

  allTotalIncidents = allTotalIncidents || totalIncidents;
  if (allTotalIncidents > allIncidentItems.length) {
    return await getAllIncidentsOfRangeType(
      rangeType,
      from,
      options,
      requestWithDefaults,
      Logger,
      allTotalIncidents,
      offset + INCIDENT_PAGE_SIZE,
      allIncidentItems
    );
  }

  return allIncidentItems;
};

const _checkForInternalSecuronixError = (Logger) => (response) => {
  const {
    body: { error, errorMessage }
  } = response;

  Logger.trace({ error, errorMessage, response }, 'Get Incidents Request');

  if (error || errorMessage) {
    const internalSecuronixError = Error('Internal Securonix Query Error');
    internalSecuronixError.status = 'internalSecuronixError';
    internalSecuronixError.description = errorMessage || error;
    throw internalSecuronixError;
  }
  return response;
};

module.exports = getAllIncidents;
