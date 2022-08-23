const getUsersByEmail = async (entityGroups, options, requestWithDefaults, Logger) => {
  if (Object.keys(entityGroups).includes('email')) {
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
      Logger.trace({ USER_BY_EMAIL: 111111111, response });
      return response;
    } catch (err) {
      throw err;
    }
  }
};

module.exports = getUsersByEmail;
