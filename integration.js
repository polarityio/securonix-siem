'use strict';

const NodeCache = require('node-cache');

const _validateOptions = require('./helpers/validateOptions');
const createRequestWithDefaults = require('./helpers/createRequestWithDefaults');

const { TIME_FOR_TOKEN_DAYS } = require('./helpers/constants');
const handleError = require('./helpers/handleError');
const { getLookupResults } = require('./helpers/getLookupResults');

let Logger;
let requestWithDefaults;
const tokenCache = new NodeCache({
  stdTTL: TIME_FOR_TOKEN_DAYS * 24 * 60 * 60 - 8000, //Token lasts Token length days
  checkperiod: 24 * 60 * 60 //Check if Expired once a day
});

function startup (logger) {
  Logger = logger;
  requestWithDefaults = createRequestWithDefaults(tokenCache, Logger);
}

const doLookup = async (entities, options, cb) => {
  Logger.debug({ entities }, 'Entities');

  let lookupResults;
  try {
    lookupResults = await getLookupResults(
      entities,
      options,
      requestWithDefaults,
      Logger
    );
  } catch (error) {
    Logger.error({ error }, 'Get Lookup Results Failed');
    return cb(handleError(error));
  }

  Logger.trace({ lookupResults }, 'Lookup Results');
  cb(null, lookupResults);
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
  switch (payload.action) {
    case 'getWatchLists':
      const response = await getWatchLists(options, requestWithDefaults, Logger);
      cb(null, response);
  }
};

const validateOptions = (options, callback) =>
  _validateOptions(requestWithDefaults, Logger, options, callback);

module.exports = {
  doLookup,
  startup,
  onMessage,
  validateOptions
};

// Lookup - Miller will research this more on face value this doesn't look too useful

// Watchlist - simple get request and list all of the responses back. Should be an onMessage button that then returns the watchlist information. *

// Users - currently have associated users with violations however will need to query the user details by workemail

// TPI - query domains via tpi_domain

// Assets - Query assets by hostname and ips

// List - Resource Groups, Users, and Peer Groups – Ignore for now until Miller gets more information

// Risk history -- query user violation risks by workemail
