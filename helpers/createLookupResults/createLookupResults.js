const _ = require("lodash");

const getViolationsForThisEntity = require("./getViolationsForThisEntity");
const getAssociatedUsers = require("./getAssociatedUsers");
const getViolations = require("./getViolations");

const createLookupResults = (url, entityGroups, { body: { events } }, Logger) =>
  _.flatMap(entityGroups, (groupEntities, entityGroupType) =>
    groupEntities.map(
      _getLookupResultForThisEntity(url, events, entityGroupType, Logger)
    )
  );

const _getLookupResultForThisEntity = (url, events, entityGroupType, Logger) => (entity) => {
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

  return {
    entity,
    data:
      violationsCount === 0
        ? null
        : {
            details: {
              associatedUsers,
              violations: _.chain(violations)
                .orderBy('violationCount', 'desc')
                .slice(0, 40)
                .value(),
              violationsCount,
              dashboardUrl: `${url}/Snypr/spotter/loadDashboard`
            }
          }
  };
};

module.exports = createLookupResults;
