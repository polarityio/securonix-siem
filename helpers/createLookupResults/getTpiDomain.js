const getTpiDomain = async (entityGroups, options, requestWithDefaults, Logger) => {
  if (Object.keys(entityGroups).includes('domain')) {
    try {
      const { domain } = entityGroups;
      const response = await requestWithDefaults({
        uri: `${options.url}/Snypr/ws/spotter/index/search?query=index=tpi AND tpi_domain=${domain[0].value}`,
        headers: {
          username: options.username,
          password: options.password,
          baseUrl: options.url
        },
        json: true
      });
      Logger.trace({ DOMAIN: 1111111, response });
      return response;
    } catch (err) {
      throw err;
    }
  }
};

module.exports = getTpiDomain;
