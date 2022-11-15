const fs = require('fs');
const { map, get, identity, compact, includes, getOr } = require('lodash/fp');
const { parallelLimit } = require('async');
const request = require('postman-request');

const getAuthToken = require('./getAuthToken');

const SUCCESSFUL_ROUNDED_REQUEST_STATUS_CODES = [200];
const RETRY_STATUS_CODES = [401, 403];
const { MAX_AUTH_RETRIES } = require('./constants');

const _configFieldIsValid = (field) => typeof field === 'string' && field.length > 0;
const parseErrorToReadableJSON = (error) =>
  JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error)));

const createRequestWithDefaults = (tokenCache, Logger) => {
  const {
    request: { ca, cert, key, passphrase, rejectUnauthorized, proxy }
  } = require('../config/config');

  const defaults = {
    ...(_configFieldIsValid(ca) && { ca: fs.readFileSync(ca) }),
    ...(_configFieldIsValid(cert) && { cert: fs.readFileSync(cert) }),
    ...(_configFieldIsValid(key) && { key: fs.readFileSync(key) }),
    ...(_configFieldIsValid(passphrase) && { passphrase }),
    ...(_configFieldIsValid(proxy) && { proxy }),
    ...(typeof rejectUnauthorized === 'boolean' && { rejectUnauthorized }),
    rejectUnauthorized: false
  };

  const requestWithDefaultsBuilder = (
    preRequestFunction = async () => ({}),
    postRequestSuccessFunction = async (x) => x,
    postRequestFailureFunction = async (e) => {
      throw e;
    }
  ) => {
    const defaultsRequest = request.defaults(defaults);

    const _requestWithDefaults = (requestOptions) =>
      new Promise((resolve, reject) => {
        defaultsRequest(requestOptions, (err, res, body) => {
          if (err) return reject(err);
          resolve({ ...res, body });
        });
      });

    return async ({ json: bodyWillBeJSON, ...requestOptions }) => {
      const preRequestFunctionResults = await preRequestFunction(requestOptions); // calls handleAUth and returns token;

      const _requestOptions = {
        ...requestOptions,
        ...preRequestFunctionResults
      };

      let postRequestFunctionResults;
      try {
        const result = await _requestWithDefaults(_requestOptions);

        checkForStatusError(result, { ..._requestOptions, json: bodyWillBeJSON });

        postRequestFunctionResults = await postRequestSuccessFunction(
          result,
          _requestOptions
        );
        const firstCharacterIsJSON = includes('{', get('body.0', result));

        postRequestFunctionResults = await postRequestSuccessFunction(
          {
            ...result,
            body:
              firstCharacterIsJSON && bodyWillBeJSON
                ? JSON.parse(result.body)
                : result.body
            // body: JSON.parse(result.body)
          },
          _requestOptions
        );
      } catch (error) {
        postRequestFunctionResults = await postRequestFailureFunction(
          error,
          _requestOptions
        );
      }
      return postRequestFunctionResults;
    };
  };

  const checkForStatusError = ({ statusCode, body }, requestOptions) => {
    const requestOptionsWithoutSensitiveData = {
      ...requestOptions
      // options: '{...}',
      // headers: {
      //   ...requestOptions.headers,
      //   Authorization: 'Bearer ****************'
      // }
    };

    Logger.trace({ CHECK_FOR_STATUS: statusCode, body, requestOptions });

    const roundedStatus = Math.round(statusCode / 100) * 100;
    const statusCodeNotSuccessful = !SUCCESSFUL_ROUNDED_REQUEST_STATUS_CODES.includes(
      roundedStatus
    );

    if (statusCodeNotSuccessful) {
      const requestError = Error('Request Error');
      requestError.status = statusCodeNotSuccessful ? statusCode : body.error;
      requestError.description = JSON.stringify(body);
      requestError.requestOptions = JSON.stringify(requestOptions);
      throw requestError;
    }
  };

  const handleAuth = async (requestOptions) => {
    const isAuthRequest = get('headers.validity', requestOptions);
    const requestWithDefaults = requestWithDefaultsBuilder();

    if (!isAuthRequest) {
      const token = await getAuthToken(
        get('headers', requestOptions),
        requestWithDefaults,
        tokenCache,
        Logger
      ).catch((error) => {
        throw error;
      });

      Logger.trace({ token }, 'Token');

      return {
        ...requestOptions,
        headers: {
          ...get('headers', requestOptions),
          token
        }
      };
    }
    return requestOptions;
  };

  const handleAndReformatErrors = async (err) => {
    const parsedErr = parseErrorToReadableJSON(err);

    if (parsedErr.requestOptions) {
      const parsedRequestOptions = JSON.parse(parsedErr.requestOptions);
      const retryCount = getOr(0, 'retryCount', parsedRequestOptions);

      const needToRetryRequest =
        RETRY_STATUS_CODES.includes(parsedErr.status) && retryCount < MAX_AUTH_RETRIES;

      if (needToRetryRequest) {
        const { username, password } = getOr({}, 'requestOptions.headers', parsedErr);

        const authCacheKey = `${username}${password}`;
        tokenCache.del(authCacheKey);

        const requestWithDefaults = requestWithDefaultsBuilder(
          handleAuth,
          identity,
          handleAndReformatErrors
        );

        parsedRequestOptions.token = undefined;

        return await requestWithDefaults({
          ...parsedRequestOptions,
          retryCount: retryCount + 1
        });
      } else {
        throw err;
      }
    } else {
      throw err;
    }
  };

  const requestDefaultsWithInterceptors = requestWithDefaultsBuilder(
    handleAuth,
    identity,
    handleAndReformatErrors
  );

  const requestsInParallel = async (
    requestsOptions,
    responseGetPath = 'body',
    limit = 10,
    Logger
  ) => {
    try {
      const unexecutedRequestFunctions = map(
        (requestOptions) => async () =>
          get(responseGetPath, await requestDefaultsWithInterceptors(requestOptions)),
        requestsOptions
      );

      return compact(parallelLimit(unexecutedRequestFunctions, limit));
    } catch (error) {
      const err = parseErrorToReadableJSON(error);
      Logger.trace({ err }, 'error in requestsInParallel');
      throw err;
    }
  };

  return { requestWithDefaults: requestDefaultsWithInterceptors, requestsInParallel };
};

module.exports = createRequestWithDefaults;
