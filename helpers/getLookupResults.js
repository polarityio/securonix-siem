
const _ = require("lodash");
const Aigle = require("aigle");
const _P = Aigle.mixin(_);

const IGNORED_IPS = new Set(["127.0.0.1", "255.255.255.255", "0.0.0.0"]);
const createLookupResults = require("./createLookupResults/index");
const getViolationResponse = require("./getViolationResponse");

const getLookupResults = (entities, options, requestWithDefaults, Logger) =>
  _partitionFlatMap(async (entitiesPartition) => {
    const entityGroups = _groupEntities(entitiesPartition, options);
    if (_.isEmpty(entityGroups)) return [];

    const violationResponse = await getViolationResponse(
      entityGroups,
      options,
      requestWithDefaults,
      Logger
    );
    if (!violationResponse) return [];
    Logger.trace({ violationResponse }, "Violation Response");

    const lookupResults = createLookupResults(
      options.url,
      entityGroups,
      violationResponse,
      Logger
    );

    return lookupResults;
  }, 10, entities);

const _partitionFlatMap = (func, partitionSize, collection, parallelLimit = 10) =>
  _P
    .chain(collection)
    .chunk(partitionSize)
    .map((x) => async () => func(x))
    .thru((x) => Aigle.parallelLimit(x, parallelLimit))
    .flatten()
    .value();

const _groupEntities = (entities, options) =>
  _.chain(entities)
    .filter(({ isIP, value }) => !isIP || (isIP && !IGNORED_IPS.has(value)))
    .groupBy(({ isIP, isDomain, isEmail, type }) =>
      isIP ? "ip" : 
      isDomain ? "domain" : 
      isEmail ? "email" : 
      type === "string" && options.searchForEmployeeId ? "string" : 
      "unknown"
    )
    .omit("unknown")
    .value();

module.exports = {
  getLookupResults,
  _groupEntities
};