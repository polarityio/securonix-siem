const _ = require('lodash');
const {
  flow,
  isEqual,
  pick,
  find,
  omit,
  getOr,
  get,
  uniqWith,
  filter,
  eq,
  map,
  parseInt
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

  const uniqueViolations = getUniqueViolationsWithAggDatetimes(violationsWithDuplicates);

  const uniqueViolationsWithAllFields = addAllFieldsToViolations(
    uniqueViolations,
    violationEvents,
    violationKeysWithoutTime
  );

  return uniqueViolationsWithAllFields;
};

const getUniqueViolationsWithAggDatetimes = (violationsWithDuplicates) =>
  flow(
    map(omit(POSSIBLE_TIME_KEYS)),
    uniqWith(isEqual),
    map((uniqViolationEvent) => ({
      ...uniqViolationEvent,
      datetime: flow(
        filter(
          flow(get('riskthreatname'), eq(get('riskthreatname', uniqViolationEvent)))
        ),
        map(flow(get('datetime'), parseInt(10)))
      )(violationsWithDuplicates)
    }))
  )(violationsWithDuplicates);

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
