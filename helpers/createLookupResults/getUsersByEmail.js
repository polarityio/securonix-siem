const _ = require('lodash');

const getUsersByEmail = async (entityGroups, options, requestWithDefaults, Logger) => {
  Logger.trace({ entityGroups: 111111111, entityGroups });
  if (_.get(entityGroups, 'email')) {
    try {
      const { email } = entityGroups;
      const response = await requestWithDefaults({
        uri: `${options.url}/Snypr/ws/spotter/index/search?query=index=users AND workemail=${email[0].value}`,
        headers: {
          username: options.username,
          password: options.password,
          baseUrl: options.url
        },
        json: true
      });
      return response.body.events;
    } catch (err) {
      throw err;
    }
  }
};

module.exports = getUsersByEmail;
