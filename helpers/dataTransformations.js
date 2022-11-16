const { filter, flow, replace, includes, toLower } = require('lodash/fp');

const getObjectsContainingString = (string, objs = [], Logger) =>
  filter(
    flow(
      JSON.stringify,
      replace(/[^\w]/g, ''),
      toLower,
      includes(flow(replace(/[^\w]/g, ''), toLower)(string))
    ),
    objs
  );

module.exports = { getObjectsContainingString };
