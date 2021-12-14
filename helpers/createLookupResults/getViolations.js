const _ = require('lodash');
const { flow, isEqual, pick, find, omit } = require('lodash/fp');

const {
  VIOLATION_KEYS,
  POSSIBLE_TIME_KEYS,
  POSSIBLE_USER_KEYS
} = require('../constants');

const getViolations = (associatedUsers, violationEvents, entityGroupType) => {
  const violationsWithDuplicates = _getViolationsWithDuplicates(
    violationEvents,
    associatedUsers,
    entityGroupType
  );

  const violationKeysWithoutTime = VIOLATION_KEYS[entityGroupType].filter(
    (key) => !anyEqual(key, POSSIBLE_TIME_KEYS)
  );

  const uniqueViolations = _removeDuplicateViolations(
    violationsWithDuplicates,
    violationKeysWithoutTime
  );

  const uniqueViolationsWithAllFields = addAllFieldsToViolations(
    uniqueViolations,
    violationEvents,
    violationKeysWithoutTime
  );

  return uniqueViolationsWithAllFields;
};

const _getViolationsWithDuplicates = (
  violationEvents,
  associatedUsers,
  entityGroupType
) =>
  violationEvents.map((violation) => {
    const associatedUser = associatedUsers.find((associatedUser) =>
      _.some(
        POSSIBLE_USER_KEYS,
        (userKey) => associatedUser[userKey] === violation[userKey]
      )
    );
    return {
      ...(associatedUser && { associatedUser }),
      ..._getViolationKeys(violation, entityGroupType)
    };
  });

const _getViolationKeys = (violation, entityGroupType) =>
  VIOLATION_KEYS[entityGroupType].reduce((agg, violationKey) => {
    const violationValue = violation[violationKey];
    return violationValue && violationValue !== 'null'
      ? {
          ...agg,
          [violationKey]: violationValue
        }
      : agg;
  }, {});

const _removeDuplicateViolations = (
  violationsWithDuplicates,
  violationKeysWithoutTime
) => {
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
  let violationDateTime = getFirstValue(violation, POSSIBLE_TIME_KEYS);
  violationDateTime = _.parseInt(violationDateTime) || violationDateTime;

  if (similarViolationIndex !== -1) {
    const aggEventTimes = _.chain(agg[similarViolationIndex].datetime)
      .concat(violationDateTime)
      .uniq()
      .value();

    return _.set(agg, `[${similarViolationIndex}]`, {
      ...agg[similarViolationIndex],
      datetime: aggEventTimes,
      violationCount: aggEventTimes.length
    });
  } else {
    return [
      ...agg,
      {
        ...violation,
        datetime: violationDateTime ? [violationDateTime] : undefined,
        violationCount: 1
      }
    ];
  }
};

const addAllFieldsToViolations = (uniqueViolations, violationEvents) =>
  _.map(uniqueViolations, (uniqueViolation) => ({
    ...uniqueViolation,
    allFields: getAllFields(uniqueViolation, violationEvents)
  }));

const getAllFields = (uniqueViolation, violationEvents, violationKeysWithoutTime) =>
  flow(
    find((violationEvent) =>
      isEqual(
        pick(violationKeysWithoutTime, violationEvent),
        pick(violationKeysWithoutTime, uniqueViolation)
      )
    ),
    omit('rawevent')
  )(violationEvents);

const getFirstValue = (obj, [key, ...keys]) =>
  obj[key] !== undefined ? obj[key] : keys.length ? getFirstValue(obj, keys) : undefined;

const anyEqual = (value, [key, ...keys]) =>
  value === key ? true : keys.length ? anyEqual(value, keys) : false;

module.exports = getViolations;
