const _ = require('lodash');
const getAllIncidents = require('./getIncidents/getAllIncidents');

const validateOptions = async (requestWithDefaults, Logger, options, callback) => {
  const stringOptionsErrorMessages = {
    url: 'You must provide a valid API URL',
    username: 'You must provide a valid Username',
    password: 'You must provide a valid Password'
  };

  const urlValidationError = _validateUrlOption(options.url);
  const stringValidationErrors = _validateStringOptions(
    stringOptionsErrorMessages,
    options
  );

  const errors = urlValidationError.concat(stringValidationErrors);
  if (!errors.length && options.searchIncidents.value) {
    try {
      await getAllIncidents(
        {
          monthsBack: options.monthsBack.value,
          username: options.username.value,
          password: options.password.value,
          url: options.url.value
        },
        requestWithDefaults,
        Logger
      );
    } catch (_) {}
  }
  callback(null, errors);
};

const _validateStringOptions = (stringOptionsErrorMessages, options, otherErrors = []) =>
  _.chain(stringOptionsErrorMessages)
    .reduce((agg, message, optionName) => {
      const isString = typeof options[optionName].value === 'string';
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
  url && url.endsWith('/')
    ? otherErrors.concat({
        key: 'url',
        message: 'Your Url must not end with a /'
      })
    : otherErrors;

module.exports = validateOptions;
