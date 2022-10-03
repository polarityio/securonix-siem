// const _ = require('lodash');
// const { getOr } = require('lodash/fp');
// const buildViolationQueryParams = require('./buildViolationQueryParams');

// const getViolationResponse = async (
//   entityGroups,
//   options,
//   requestWithDefaults,
//   Logger
// ) => {
//   try {
//     const response = await requestWithDefaults({
//       uri: `${options.url}/Snypr/ws/spotter/index/search`,
//       headers: {
//         username: options.username,
//         password: options.password,
//         baseUrl: options.url
//       },
//       qs: buildViolationQueryParams(
//         entityGroups,
//         options.monthsBack,
//         'violation',
//         Logger
//       ),
//       json: true
//     });

//     Logger.trace({ RESPONSE: response });
//     // return response; // causes circular response, but doesn't crash in createLookupResults
//     return response
//   } catch (err) {
//     throw err;
//   }
// };

// const _checkForInternalSecuronixError = (Logger) => (response) => {
//   const {
//     body: { error, errorMessage }
//   } = response;
//   Logger.trace({ error, errorMessage, response }, 'Get Violations Request');
//   if (error || errorMessage) {
//     const internalSecuronixError = Error('Internal Securonix Query Error');
//     internalSecuronixError.status = 'internalSecuronixError';
//     internalSecuronixError.description = errorMessage || error;
//     throw internalSecuronixError;
//   }
//   return response;
// };

const _ = require('lodash');
const buildViolationQueryParams = require('./buildViolationQueryParams');

const getViolationResponse = async (
  entityGroups,
  options,
  requestWithDefaults,
  Logger
) => {
  try {
    const response = await requestWithDefaults({
      uri: `${options.url}/Snypr/ws/spotter/index/search`,
      headers: {
        username: options.username,
        password: options.password,
        baseUrl: options.url
      },
      qs: buildViolationQueryParams(
        entityGroups,
        options.monthsBack,
        'violation',
        Logger
      ),
      json: true
    });

    Logger.trace({ RESPONSE: 222222222222, response });
    // const results = JSON.parse(response);
    // Logger.trace({ RESPONSE: 33333333, results });

    const body = JSON.parse(_.get(response, 'body'));
    Logger.trace({ BODY: body });
    return body;
  } catch (err) {
    Logger.error({ TEST: 1231231231, err });
    throw err;
  }
};

module.exports = getViolationResponse;
