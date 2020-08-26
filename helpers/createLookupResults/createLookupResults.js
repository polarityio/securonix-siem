const _ = require("lodash");

const getViolationsForThisEntity = require("./getViolationsForThisEntity");
const getAssociatedUsers = require("./getAssociatedUsers");
const getViolations = require("./getViolations");

const createLookupResults = (url, entityGroups, { body: { events } }) =>
  _.flatMap(entityGroups, (groupEntities, entityGroupType) =>
    groupEntities.map(
      _getLookupResultForThisEntity(url, events, entityGroupType)
    )
  );

const _getLookupResultForThisEntity = (url, events, entityGroupType) => (entity) => {
  const violationEventsForThisEntity = getViolationsForThisEntity(
    events,
    entity,
    entityGroupType
  );

  const associatedUsers = getAssociatedUsers(violationEventsForThisEntity);

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
    data: violationsCount === 0 ? null : {
      details: {
        associatedUsers,
        violations: _.chain(violations)
          .orderBy("violationCount", "desc")
          .slice(0, 40)
          .value(),
        violationsCount,
        dashboardUrl: `${url}/Snypr/configurableDashboards/view`
      }
    }
  };
};

module.exports = createLookupResults;
