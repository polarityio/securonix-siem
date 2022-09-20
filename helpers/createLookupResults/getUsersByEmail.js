const _ = require('lodash');

const getUsersByEmail = async (options, entity, requestWithDefaults, Logger) => {
  try {
    const response = await requestWithDefaults({
      uri:
        options.url +
        `/Snypr/ws/spotter/index/search?query=index=users AND workemail=${entity.value}`,
      headers: {
        username: options.username,
        password: options.password,
        baseUrl: options.url
      },
      json: true
    });

    return {
      usersByEmail: {
        users: response.body.events,
        userCount: _.size(response.body.events)
      }
    };
  } catch (err) {
    Logger.trace({ ERR: err });
    throw err;
  }
};

module.exports = getUsersByEmail;
