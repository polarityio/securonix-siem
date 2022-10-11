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

  Logger.trace({ lookupResults }, 'results returned from dolookup');
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
  const actions = {
    getWatchLists: await getWatchLists(options, requestWithDefaults, Logger)
  };
  return cb(null, actions[payload.action]);
};

const validateOptions = (options, callback) =>
  _validateOptions(requestWithDefaults, Logger, options, callback);

module.exports = {
  doLookup,
  startup,
  onMessage,
  validateOptions
};

// [
//   {
//     tpi_ip: '99.83.154.118',
//     tpi_src: 'ThreatQ_Blacklist',
//     tpi_src_organization: 'ThreatQ',
//     tpi_date: '1665431226887',
//     tpi_criticality: '0.6',
//     tenantid: '2',
//     tpi_malware: 'RedLine Stealer',
//     tpi_description: '',
//     tenantname: 'a1t1sipi',
//     tpi_type: 'Malicious IP Address',
//     tpi_dt_firstseen: '1627521790000',
//     tpi_risk: 'Very High'
//   }
// ];

// [
//   {
//     resourcegroupname: 'paloaltofw01',
//     violator: 'Activityip',
//     policies: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<policies/>\n',
//     entityid: '10.0.4.107',
//     threatmodels:
//       '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<policies/>\n',
//     doctype: 'category',
//     resourcegroupid: '86',
//     lastgeneratetime: '10/11/2022 14:08:46',
//     riskscore: '11.4',
//     resourcename: 'PALOALTOFW01',
//     categories:
//       '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<categories>\n    <category>\n        <geolocationData/>\n        <id>10039</id>\n        <isSandBox>false</isSandBox>\n        <lastgeneratetime>1665511726848</lastgeneratetime>\n        <name>SANDBOX-Command and Control</name>\n        <remark>NewViolationsUpdated</remark>\n        <score>11.4</score>\n        <scoreAsLong>1140</scoreAsLong>\n        <scoreChanged>false</scoreChanged>\n        <toDelete>false</toDelete>\n        <userData/>\n        <violatedRgIds>86</violatedRgIds>\n    </category>\n</categories>\n',
//     rg_resourcetypeid: '45',
//     category: 'SANDBOX-Command and Control',
//     remarks: 'NewViolationsUpdated',
//     rg_type: 'Palo Alto Next-Generation Firewall'
//   }
// ];

// Watchlist - simple get a request and list all of the responses back. Should be an onMessage button that then returns the watchlist information.

// Users - currently have associated users with violations however will need to query the user details by workemail

// TPI - query domains via tpi_domain

// Assets - Query assets by hostname and ips - NO DATA YET.

// Risk history -- query user violation risks by workemail.
