const m = require("moment");
const _ = require("lodash");
const { QUERY_KEYS } = require("./constants");

const buildViolationQueryParams = (entityGroups, monthsBack, dateTo) => ({
  query: _buildSecuronixQuery(entityGroups),
  ..._getTimeframeParams(monthsBack, dateTo)
});

const _buildSecuronixQuery = (entityGroups) => {
  const getEntityGroupQueryString = (groupEntities, entityGroupType) =>
    _.chain(groupEntities)
      .flatMap(({ value }) =>
        QUERY_KEYS[entityGroupType].map((queryKey) => `${queryKey}="${value}"`)
      )
      .join(" OR ")
      .value();

  return _.chain(entityGroups)
    .map(getEntityGroupQueryString)
    .join(" OR ")
    .thru((unfinishedQuery) => `index=violation AND (${unfinishedQuery})`)
    .value();
};

const _getTimeframeParams = (monthsBack, dateTo) => ({
  generationtime_from: m.utc(dateTo)
    .subtract(Math.floor(Math.abs(monthsBack)), "months")
    .subtract((Math.abs(monthsBack) % 1) * 30.41, "days")
    .format("MM/DD/YYYY HH:mm:ss"),

  generationtime_to: m.utc(dateTo).format("MM/DD/YYYY HH:mm:ss")
});

module.exports = buildViolationQueryParams;
