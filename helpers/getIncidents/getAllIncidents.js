const m = require('moment');
const { flow, concat, uniqBy } = require('lodash/fp');

const NodeCache = require('node-cache');
const { INCIDENT_PAGE_SIZE } = require('../constants');

const incidentCache = new NodeCache({
  stdTTL: 60 * 60
});

const getAllIncidents = async (options, requestsInParallel, Logger) => {
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
    requestsInParallel,
    Logger
  );

  const closedIncidents = await getAllIncidentsOfRangeType(
    'closed',
    lookBackTime,
    options,
    requestsInParallel,
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
  requestsInParallel,
  Logger
) => {
  let offset = 0;
  let aggIncidents = [];
  let allTotalIncidents;

  const incidentRequestOptions = {
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
  };

  const incidentData = await requestsInParallel(
    [incidentRequestOptions],
    'body.events',
    10,
    Logger
  );

  const { totalIncidents, incidentItems } = incidentData;

  const allIncidentItems = aggIncidents.concat(incidentItems);

  allTotalIncidents = allTotalIncidents || totalIncidents;
  if (allTotalIncidents > allIncidentItems.length) {
    return await getAllIncidentsOfRangeType(
      rangeType,
      from,
      options,
      requestsInParallel,
      allTotalIncidents,
      offset + INCIDENT_PAGE_SIZE,
      allIncidentItems
    );
  }

  return allIncidentItems;
};

module.exports = getAllIncidents;
