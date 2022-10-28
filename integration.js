'use strict';
const { map } = require('lodash/fp');
const NodeCache = require('node-cache');

const _validateOptions = require('./helpers/validateOptions');
const createRequestWithDefaults = require('./helpers/createRequestWithDefaults');

const { TIME_FOR_TOKEN_DAYS } = require('./helpers/constants');
const handleError = require('./helpers/handleError');
const { getLookupResults } = require('./helpers/getLookupResults');

let Logger;
let requestFunctions;

const tokenCache = new NodeCache({
  stdTTL: TIME_FOR_TOKEN_DAYS * 24 * 60 * 60 - 8000, //Token lasts Token length days
  checkperiod: 24 * 60 * 60 //Check if Expired once a day
});

const transformType = (entity) => {
  if (entity.isIP) return 'ip';
  if (entity.isDomain) return 'domain';
  if (entity.isEmail) return 'email';
};

function startup (logger) {
  Logger = logger;
  requestFunctions = createRequestWithDefaults(tokenCache, Logger);
}

const doLookup = async (entities, options, cb) => {
  Logger.debug({ entities }, 'Entities');
  let lookupResults;

  try {
    lookupResults = await Promise.all(
      map(async (searchedEntity) => {
        const entity = { ...searchedEntity, transformedEntityType: transformType(searchedEntity) };
        const lookupResults = await getLookupResults(
          entity,
          options,
          requestFunctions,
          Logger
        );
        return lookupResults;
      }, entities)
    );
    Logger.trace({ lookupResults });
    return cb(null, lookupResults);
  } catch (error) {
    Logger.error({ error }, 'Get Lookup Results Failed');
    return cb(handleError(error));
  }
};

const getWatchLists = async (options, requestWithDefaults, Logger) => {
  const response = await requestWithDefaults({
    uri: `${options.url}/Snypr/ws/incident/listWatchlist`,
    headers: {
      username: options.username,
      password: options.password,
      baseUrl: options.url
    },
    json: true
  });
  return response;
};

const onMessage = async (payload, options, cb) => {
  const actions = {
    getWatchLists: await getWatchLists(
      options,
      requestFunctions.requestWithDefaults,
      Logger
    )
  };
  return cb(null, actions[payload.action]);
};

const validateOptions = (options, callback) =>
  _validateOptions(requestFunctions.requestWithDefaults, Logger, options, callback);

module.exports = {
  doLookup,
  startup,
  onMessage,
  validateOptions
};
