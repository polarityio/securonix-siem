const _ = require('lodash');
const {
  flow,
  isEqual,
  pick,
  find,
  omit,
  getOr,
  get,
  concat,
  uniq,
  compact,
  isEmpty
} = require('lodash/fp');

const {
  VIOLATION_KEYS,
  POSSIBLE_TIME_KEYS,
  POSSIBLE_USER_KEYS
} = require('../constants');

const getViolations = (associatedUsers, violationEvents, entityGroupType, Logger) => {
  const violationsWithDuplicates = _getViolationsWithDuplicates(
    violationEvents,
    associatedUsers,
    entityGroupType,
    Logger
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
  entityGroupType,
  Logger
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
  getOr([], entityGroupType, VIOLATION_KEYS).reduce((agg, violationKey) => {
    const violationValue = get(violationKey, violation);
    return violationValue
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
  return compact(violations);
};

const _aggregateViolation = (similarViolationIndex, agg, violation) => {
  let violationDateTime = getFirstValue(violation, POSSIBLE_TIME_KEYS);
  violationDateTime = _.parseInt(violationDateTime) || violationDateTime;

  if (similarViolationIndex !== -1) {
    const aggEventTimes = flow(
      get([similarViolationIndex, 'datetime']),
      concat(violationDateTime),
      uniq,
      compact
    )(agg);

    const eventTimes = aggEventTimes.length;

    return eventTimes
      ? _.set(agg, `[${similarViolationIndex}]`, {
          ...agg[similarViolationIndex],
          datetime: aggEventTimes,
          violationCount: aggEventTimes.length
        })
      : agg;
  } else {
    return !isEmpty(violation.allFields)
      ? [
          ...agg,
          {
            ...violation,
            datetime: violationDateTime ? [violationDateTime] : undefined,
            violationCount: 1
          }
        ]
      : agg;
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
