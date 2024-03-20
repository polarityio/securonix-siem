'use strict';
const { map } = require('lodash/fp');
const NodeCache = require('node-cache');

const _validateOptions = require('./helpers/validateOptions');
const createRequestWithDefaults = require('./helpers/createRequestWithDefaults');

const { TIME_FOR_TOKEN_DAYS } = require('./helpers/constants');
const handleError = require('./helpers/handleError');
const { getLookupResults } = require('./helpers/getLookupResults');

const parseErrorToReadableJSON = (error) =>
  JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error)));

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

function startup(logger) {
  Logger = logger;
  requestFunctions = createRequestWithDefaults(tokenCache, Logger);
}

const doLookup = async (entities, options, cb) => {
  Logger.debug({ entities }, 'Entities');
  let lookupResults;

  try {
    lookupResults = await Promise.all(
      map(async (searchedEntity) => {
        const entity = {
          ...searchedEntity,
          transformedEntityType: transformType(searchedEntity)
        };

        const lookupResults = await getLookupResults(
          entity,
          options,
          requestFunctions,
          Logger
        );

        return lookupResults;
      }, entities)
    );
    Logger.debug({ lookupResults }, 'doLookup lookupResults');

    return cb(null, lookupResults);
  } catch (error) {
    const err = parseErrorToReadableJSON(error);
    Logger.error({ err }, 'Get Lookup Results Failed');
    return cb(handleError(err));
    // return cb({ detail: error.message || 'Lookup Failed', err });
  }
};

const validateOptions = (options, callback) =>
  _validateOptions(requestFunctions.requestWithDefaults, Logger, options, callback);

module.exports = {
  doLookup,
  startup,
  validateOptions
};
