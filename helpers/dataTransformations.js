const { filter, flow, replace, includes, toLower } = require('lodash/fp');

const getObjectsContainingString = (string, objs = [], Logger) =>
  filter(
    flow(
      // (x) => {
      //   Logger.trace({ asda: x });
      //   return x;
      // },
      JSON.stringify,
      // (x) => {
      //   Logger.trace({ asdas: x });
      //   return x;
      // },
      replace(/[^\w]/g, ''),
      // (x) => {
      //   Logger.trace({ asdas: x });
      //   return x;
      // },
      toLower,
      // (x) => {
      //   Logger.trace({ asdas: x });
      //   return x;
      // },
      includes(flow(replace(/[^\w]/g, ''), toLower)(string))
      // (x) => {
      //   Logger.trace({ asdas: x });
      //   return x;
      // }
    ),
    objs
  );

module.exports = { getObjectsContainingString };
