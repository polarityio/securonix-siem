const { VIOLATION_KEYS } = require("../constants");
const _ = require("lodash");

const getViolations = (associatedUsers, violationEvents, entityGroupType) => {
  const violationsWithDuplicates = _getViolationsWithDuplicates(
    violationEvents,
    associatedUsers,
    entityGroupType
  );

  return _removeDuplicateViolations(violationsWithDuplicates, entityGroupType);
};

const _getViolationsWithDuplicates = (violationEvents, associatedUsers, entityGroupType) =>
  violationEvents.map((violation) => {
    const associatedUser = associatedUsers.find(
      ({ workemail }) => workemail === violation.u_workemail
    );
    return {
      ...(associatedUser && { associatedUser }),
      ..._getViolationKeys(violation, entityGroupType)
    };
  });

const _getViolationKeys = (violation, entityGroupType) =>
  VIOLATION_KEYS[entityGroupType].reduce((agg, violationKey) => {
    const violationValue = violation[violationKey];
    return violationValue && violationValue !== "null"
      ? {
          ...agg,
          [violationKey]: violationValue
        }
      : agg;
  }, {});

const _removeDuplicateViolations = (violationsWithDuplicates, entityGroupType) => {
  const violationKeysWithoutTime = VIOLATION_KEYS[entityGroupType].filter(
    (key) => key !== "eventtime"
  );

  const violations = violationsWithDuplicates.reduce((agg, violation) => {
    const similarViolationIndex = agg.findIndex((aggViolation) =>
      _.isEqual(
        _.pick(violation, violationKeysWithoutTime),
        _.pick(aggViolation, violationKeysWithoutTime)
      )
    );

    return _aggregateViolation(similarViolationIndex, agg, violation);
  }, []);
  return violations;
};

const _aggregateViolation = (similarViolationIndex, agg, violation) => {
  if (similarViolationIndex !== -1) {
    const aggEventTimes = _.chain(agg[similarViolationIndex].eventtime)
      .concat(violation.eventtime)
      .uniq()
      .value();

    return _.set(agg, `[${similarViolationIndex}]`, {
      ...agg[similarViolationIndex],
      eventtime: aggEventTimes,
      violationCount: aggEventTimes.length
    });
  } else {
    return [
      ...agg,
      { ...violation, eventtime: [violation.eventtime], violationCount: 1 }
    ];
  }
};

module.exports = getViolations;
