const _ = require("lodash");
const { QUERY_KEYS } = require("../constants");

const getViolationsForThisEntity = (events, entity, entityGroupType) =>
  _.filter(events, _doesEventMatchThisEntity(entity, entityGroupType));

const _doesEventMatchThisEntity = (entity, entityGroupType) => (violationEvent) =>
  QUERY_KEYS[entityGroupType].some((possibleEventKey) => {
    let eventIdValue = _.find(violationEvent, (v, k) => k.includes(possibleEventKey));

    if (eventIdValue) {
      eventIdValue = eventIdValue.toLowerCase();
      const entityValue = entity.value.toLowerCase();

      const eventIdValueMatchesEntityValue = eventIdValue === entityValue;

      const eventIdValueMightContainEntityValue =
        !eventIdValueMatchesEntityValue &&
        entityGroupType === "domain" &&
        (possibleEventKey === "destinationhostname" || possibleEventKey === "requesturl");

      const eventIdValueContainsEntityValue =
        eventIdValueMightContainEntityValue && eventIdValue.includes(entityValue);

      return eventIdValueMatchesEntityValue || eventIdValueContainsEntityValue;
    }
  });

module.exports = getViolationsForThisEntity;
