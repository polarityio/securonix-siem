const _ = require('lodash');

const getViolationsForThisEntity = require('./getViolationsForThisEntity');
const getAssociatedUsers = require('./getAssociatedUsers');
const getViolations = require('./getViolations');

const { MAX_VIOLATION_RESULTS, MAX_INCIDENTS_RESULTS } = require('../constants');

const createLookupResults = (
  url,
  { body: { events } },
  users,
  incidents,
  tpiResponse,
  entityGroups,
  Logger
) =>
  _.flatMap(entityGroups, (groupEntities, entityGroupType) =>
    groupEntities.map(
      _getLookupResultForThisEntity(
        url,
        events,
        users,
        incidents,
        tpiResponse,
        entityGroupType,
        Logger
      )
    )
  );

const _getLookupResultForThisEntity = (
  url,
  events,
  users,
  foundIncidents,
  tpiResponse,
  entityGroupType,
  Logger
) => (entity) => {
  const violationEventsForThisEntity = getViolationsForThisEntity(
    events,
    entity,
    entityGroupType
  );

  const associatedUsers = getAssociatedUsers(violationEventsForThisEntity, Logger);

  const violations = getViolations(
    associatedUsers,
    violationEventsForThisEntity,
    entityGroupType
  );

  const violationsCount = violations.reduce(
    (agg, violation) => agg + violation.violationCount,
    0
  );

  const incidents = foundIncidents[entity.value];

  return {
    entity,
    data:
      violationsCount || _.size(incidents) || _.size(users)
        ? {
            details: {
              associatedUsers,
              usersByEmails: {
                users,
                userCount: _.size(users)
              },
              violations: _.chain(violations)
                .orderBy('violationCount', 'desc')
                .slice(0, MAX_VIOLATION_RESULTS)
                .value(),
              violationsCount,
              spotterUrl: `${url}/Snypr/spotter/loadDashboard`,
              MAX_VIOLATION_RESULTS,
              incidentsCount: _.size(incidents),
              incidents: _.chain(incidents)
                .orderBy('lastUpdateDate', 'desc')
                .slice(0, MAX_INCIDENTS_RESULTS)
                .value(),
              MAX_INCIDENTS_RESULTS,
              incidentUrl: `${url}/Snypr/configurableDashboards/view?menuname=Incident Management&section=10`
            }
          }
        : null
  };
};

module.exports = createLookupResults;
