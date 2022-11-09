const fs = require('fs');
const { map, get, identity } = require('lodash/fp');
const { parallelLimit } = require('async');
const request = require('postman-request');

const getAuthToken = require('./getAuthToken');

const SUCCESSFUL_ROUNDED_REQUEST_STATUS_CODES = [200];
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
        checkForStatusError(result, _requestOptions);

        postRequestFunctionResults = await postRequestSuccessFunction(
          result,
          _requestOptions
        );

        postRequestFunctionResults = await postRequestSuccessFunction(
          {
            ...result,
            body: bodyWillBeJSON ? JSON.parse(result.body) : result.body
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
      ...requestOptions,
      options: '{...}',
      headers: {
        ...requestOptions.headers,
        Authorization: 'Bearer ****************'
      }
    };

    const roundedStatus = Math.round(statusCode / 100) * 100;
    const statusCodeNotSuccessful = !SUCCESSFUL_ROUNDED_REQUEST_STATUS_CODES.includes(
      roundedStatus
    );

    if (statusCodeNotSuccessful) {
      const requestError = Error('Request Error');
      requestError.status = statusCodeNotSuccessful ? statusCode : body.error;
      requestError.description = JSON.stringify(body);
      requestError.requestOptions = JSON.stringify(requestOptionsWithoutSensitiveData);
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

  const handleAndReformatErrors = (err) => {
    if (err.requestOptions) {
      const retryCount = (err.requestOptions && err.requestOptions.retryCount) || 0;

      const needToRetryRequest =
        err.status === 403 && err.requestOptions && retryCount <= MAX_AUTH_RETRIES;

      if (needToRetryRequest) {
        const { username, password } = err.requestOptions.headers;
        const authCacheKey = `${username}${password}`;
        tokenCache.del(authCacheKey);

        return requestDefaultsWithInterceptors({
          ...err.requestOptions,
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

      return parallelLimit(unexecutedRequestFunctions, limit);
    } catch (error) {
      const err = parseErrorToReadableJSON(error);
      Logger.trace({ err }, 'error in requestsInParallel');
      throw err;
    }
  };

  return { requestWithDefaults: requestDefaultsWithInterceptors, requestsInParallel };
};

module.exports = createRequestWithDefaults;
