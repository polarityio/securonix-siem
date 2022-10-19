const fs = require('fs');
const { map, get } = require('lodash/fp');
const request = require('request');
const { parallelLimit } = require('async');

const config = require('../config/config');
const getAuthToken = require('./getAuthToken');

const SUCCESSFUL_ROUNDED_REQUEST_STATUS_CODES = [200];

const MAX_AUTH_RETRIES = 1;
const _configFieldIsValid = (field) => typeof field === 'string' && field.length > 0;

const createRequestWithDefaults = (tokenCache, Logger) => {
  const {
    request: { ca, cert, key, passphrase, rejectUnauthorized, proxy }
  } = config;

  const defaults = {
    ...(_configFieldIsValid(ca) && { ca: fs.readFileSync(ca) }),
    ...(_configFieldIsValid(cert) && { cert: fs.readFileSync(cert) }),
    ...(_configFieldIsValid(key) && { key: fs.readFileSync(key) }),
    ...(_configFieldIsValid(passphrase) && { passphrase }),
    ...(_configFieldIsValid(proxy) && { proxy }),
    ...(typeof rejectUnauthorized === 'boolean' && { rejectUnauthorized })
  };

  const requestWithDefaults = (
    preRequestFunction = () => ({}),
    postRequestSuccessFunction = (x) => x,
    postRequestFailureFunction = (e) => {
      throw e;
    }
  ) => {
    const defaultsRequest = request.defaults(defaults);

    const _requestWithDefault = (requestOptions) =>
      new Promise((resolve, reject) => {
        defaultsRequest(requestOptions, (err, res, body) => {
          if (err) return reject(err);
          resolve({ ...res, body });
        });
      });

    return async ({ json: bodyWillBeJSON, ...requestOptions }) => {
      const preRequestFunctionResults = await preRequestFunction(requestOptions);
      const _requestOptions = {
        ...requestOptions,
        ...preRequestFunctionResults
      };

      let postRequestFunctionResults;
      try {
        const result = await _requestWithDefault(_requestOptions);

        checkForStatusError(result, _requestOptions);

        postRequestFunctionResults = await postRequestSuccessFunction({
          ...result,
          body: bodyWillBeJSON ? JSON.parse(result.body) : result.body
        });
      } catch (error) {
        postRequestFunctionResults = await postRequestFailureFunction(
          error,
          _requestOptions
        );
      }

      return postRequestFunctionResults;
    };
  };

  const handleAuth = async (requestOptions) => {
    const isAuthRequest = requestOptions.headers.validity;
    if (!isAuthRequest) {
      const token = await getAuthToken(
        requestOptions.headers,
        requestDefaultsWithInterceptors,
        tokenCache
      ).catch((error) => {
        throw error;
      });

      Logger.trace({ token }, 'Token');

      return {
        ...requestOptions,
        headers: {
          ...requestOptions.headers,
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

  const checkForStatusError = ({ statusCode, body }, requestOptions) => {
    Logger.trace({
      requestOptions: {
        ...requestOptions,
        headers: {
          ...requestOptions.headers,
          token: '************'
        },
        options: '************'
      },
      statusCode,
      body
    });

    const roundedStatus = Math.round(statusCode / 100) * 100;
    if (!SUCCESSFUL_ROUNDED_REQUEST_STATUS_CODES.includes(roundedStatus)) {
      const requestError = Error('Request Error');
      requestError.status = statusCode;
      requestError.description = JSON.stringify(body);
      requestError.requestOptions = JSON.stringify(requestOptions);
      throw requestError;
    }
  };

  const requestDefaultsWithInterceptors = requestWithDefaults(
    handleAuth,
    (r) => r,
    handleAndReformatErrors
  );

  const requestsInParallel = async (
    requestsOptions,
    responseGetPath = 'body',
    limit = 10
  ) => {
    const unexecutedRequestFunctions = map(
      (requestOptions) => async () =>
        get(responseGetPath, await requestDefaultsWithInterceptors(requestOptions)),
      requestsOptions
    );

    return await parallelLimit(unexecutedRequestFunctions, limit);
  };

  return { requestWithDefaults: requestDefaultsWithInterceptors, requestsInParallel };
};

module.exports = createRequestWithDefaults;
