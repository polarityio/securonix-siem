
const _ = require("lodash");
const Aigle = require("aigle");
const _P = Aigle.mixin(_);

const IGNORED_IPS = new Set(["127.0.0.1", "255.255.255.255", "0.0.0.0"]);
const createLookupResults = require("./createLookupResults/index");
const getViolationResponse = require("./getViolationResponse");
const getIncidents = require("./getIncidents");

const getLookupResults = (entities, options, requestWithDefaults, Logger) =>
  _partitionFlatMap(async (entitiesPartition) => {
    const entityGroups = _groupEntities(entitiesPartition, options);
    if (_.isEmpty(entityGroups)) return [];

    const incidents = options.searchIncidents
      ? await getIncidents(entitiesPartition, options, requestWithDefaults, Logger)
      : {};

    const violationResponse = await getViolationResponse(
      entityGroups,
      options,
      requestWithDefaults,
      Logger
    );

    if (!(violationResponse || incidents))
      return _.map(entitiesPartition, (entity) => ({ entity, data: null }));

    Logger.trace({ violationResponse }, "Violation Response");

    const lookupResults = createLookupResults(
      options.url,
      entityGroups,
      violationResponse,
      incidents,
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
    .groupBy(({ isIP, isDomain, isEmail, type, types }) =>
      isIP ? "ip" : 
      isDomain ? "domain" : 
      isEmail ? "email" : 
      type === "string" && options.searchForEmployeeId ? "string" : 
      type === 'custom' && types.indexOf('custom.username') >= 0 ? "username" : 
      type === 'custom' && types.indexOf('custom.hostname') >= 0 ? "hostname" : 
      "unknown"
    )
    .omit("unknown")
    .value();

module.exports = {
  getLookupResults,
  _groupEntities
};