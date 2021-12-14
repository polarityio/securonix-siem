const fs = require("fs");
const request = require("request");
const { promisify } = require("util");

const config = require("../config/config");
const getAuthToken = require("./getAuthToken");

const MAX_AUTH_RETRIES = 1;
const _configFieldIsValid = (field) =>
  typeof field === "string" && field.length > 0;

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
    ...(typeof rejectUnauthorized === 'boolean' && { rejectUnauthorized }),
    rejectUnauthorized:false
  };

  const requestWithDefaults = (
    preRequestFunction = () => ({}),
    postRequestSuccessFunction = (x) => x,
    postRequestFailureFunction = (e) => { throw e; }
  ) => async ({ json: bodyWillBeJSON, ...requestOptions }) => {
    const _requestWithDefault = promisify(request.defaults(defaults));
    const preRequestFunctionResults = await preRequestFunction(requestOptions);
    const _requestOptions = {
      ...requestOptions,
      ...preRequestFunctionResults,
    };

    let postRequestFunctionResults;
    try {
      const { body, ...result } = await _requestWithDefault(_requestOptions);

      checkForError({ body, ...result });

      postRequestFunctionResults = await postRequestSuccessFunction({
        ...result,
        body: bodyWillBeJSON ? JSON.parse(body) : body,
      });
    } catch (error) {
      postRequestFunctionResults = await postRequestFailureFunction(
        error,
        _requestOptions
      );
    }

    return postRequestFunctionResults;
  };

  const handleAuth = async (requestOptions) => {
    const isAuthRequest = requestOptions.headers.validity;
    if (!isAuthRequest) {
      const token = await getAuthToken(
        requestOptions.headers,
        requestDefaultsWithInterceptors,
        tokenCache
      ).catch((error) => {
        Logger.error({ error }, "Unable to retrieve Auth Token");
        throw error;
      });

      Logger.trace({ token }, "Token");

      return {
        ...requestOptions,
        headers: {
          ...requestOptions.headers,
          token,
        },
      };
    }

    return requestOptions;
  };

  const handleAndReformatErrors = (err) => {
    if (err.requestOptions) {
      const retryCount =
        (err.requestOptions && err.requestOptions.retryCount) || 0;

      const needToRetryRequest =
        err.status === 403 &&
        err.requestOptions &&
        retryCount <= MAX_AUTH_RETRIES;

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

  const checkForError = ({ statusCode, body }, requestOptions) => {
    if (Math.round(statusCode / 100) * 100 !== 200) {
      const securonixRequestError = Error("Securonix Request Error");
      securonixRequestError.status = statusCode;
      securonixRequestError.description = body;
      securonixRequestError.requestOptions = requestOptions;
      throw securonixRequestError;
    }
  };

  const requestDefaultsWithInterceptors = requestWithDefaults(
    handleAuth,
    (r) => r,
    handleAndReformatErrors
  );
  return requestDefaultsWithInterceptors;
};

module.exports = createRequestWithDefaults;
