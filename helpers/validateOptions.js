const _ = require("lodash");

const validateOptions = (options, callback) => {
  const stringOptionsErrorMessages = {
    url: "You must provide a valid API URL",
    username: "You must provide a valid Username",
    password: "You must provide a valid Password"
  };

  const urlValidationError = _validateUrlOption(options.url);
  const stringValidationErrors = _validateStringOptions(
    stringOptionsErrorMessages,
    options
  );

  callback(null, [...urlValidationError, ...stringValidationErrors]);
};

const _validateStringOptions = (stringOptionsErrorMessages, options, otherErrors = []) =>
  _.chain(stringOptionsErrorMessages)
    .reduce((agg, message, optionName) => {
      const isString = typeof options[optionName].value === "string";
      const isEmptyString = isString && _.isEmpty(options[optionName].value);

      return !isString || isEmptyString
        ? agg.concat({
            key: optionName,
            message
          })
        : agg;
    }, otherErrors)
    .value();

const _validateUrlOption = ({ value: url }, otherErrors = []) =>
  url && url.endsWith("/")
    ? otherErrors.concat({
        key: "url",
        message: "Your Url must not end with a /"
      })
    : otherErrors;

module.exports = validateOptions;
