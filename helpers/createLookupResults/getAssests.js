const _ = require('lodash');

const getAssets = async (options, entity, requestWithDefaults, Logger) => {
  try {
    const response = await requestWithDefaults({
      uri: `${options.url}/Snypr/ws/spotter/index/search?query=index=asset AND entityname=${entity.value}`,
      headers: {
        username: options.username,
        password: options.password,
        baseUrl: options.url
      },
      json: true
    });

    Logger.trace({ GET_ASSETS: response });
    return {
      assets: response.body.events,
      assetCount: _.size(response.body.events)
    };
  } catch (err) {
    Logger.error({ ERR: err });
    throw err;
  }
};

module.exports = getAssets;
