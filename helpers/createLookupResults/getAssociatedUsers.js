const _ = require("lodash");
const { ASSOCIATED_USER_KEYS } = require("../constants");

const getAssociatedUsers = (violationEvents) =>
  _.chain(violationEvents)
    .reduce(_getAssociatedUserKeysIfEventHasEmail, [])
    .groupBy("u_workemail")
    .map((userGroup) => {
      const aggregatedUser = _mergeObjects(userGroup);

      const flightRiskLevel = _getFlightRiskLevel(userGroup);

      return _formatAggregatedUser(aggregatedUser, flightRiskLevel, userGroup);
    })
    .value();

const _getAssociatedUserKeysIfEventHasEmail = (agg, violationEvent) =>
  violationEvent.u_workemail
    ? [...agg, _.pick(violationEvent, ASSOCIATED_USER_KEYS)]
    : agg;

const _mergeObjects = (objs) => _.merge.apply(_, [{}].concat(objs));

const _getFlightRiskLevel = (userGroup) =>
  userGroup.some(
    ({ policyname, riskthreatname }) =>
      policyname === "Flight Risk User" ||
      riskthreatname === "Possible flight risk behavior"
  )
    ? "High"
    : "Low";

const _formatAggregatedUser = (aggregatedUser, flightRiskLevel, userGroup) => ({
  ..._formatUserKeys(aggregatedUser),
  fullname: _getFullname(
    aggregatedUser.u_preferredname,
    aggregatedUser.u_fullname
  ),
  violationCount: userGroup.length,
  flightRiskLevel,
  ...(_keyIsValid("u_hiredate", aggregatedUser) && {
    timeWithCompany: _getTimeWithCompany(aggregatedUser.u_hiredate),
  })
});

const _keyIsValid = (key, user) => user[key] && user[key] !== "null";

const _formatUserKeys = (aggregatedUser) => {
  const userKeys = _.chain(ASSOCIATED_USER_KEYS)
    .filter((key) => key.startsWith("u_"))
    .thru((keys) => _.pick(aggregatedUser, keys))
    .reduce((agg, value, key) => ({ ...agg, [key.slice(2)]: value }), {})
    .value();

  const nonUserKeys = _.pick(
    aggregatedUser,
    ASSOCIATED_USER_KEYS.filter((key) => !key.startsWith("u_"))
  );

  return {
    ...userKeys,
    ...nonUserKeys,
  };
}
const _getFullname = (preferredname, fullname) =>
  !(preferredname || fullname)
    ? "No Registered Name"
    : preferredname
    ? preferredname
        .split(", ")
        .reverse()
        .join(" ")
    : fullname;

const _getTimeWithCompany = (hiredate) => {
  const years = moment.utc(new Date()).diff(moment(hiredate), "years", false);
  const yearsString = years > 0 ? `${years} Years ` : "";

  const months = moment.utc(new Date()).diff(moment(hiredate), "months", false) - years * 12;
  const monthsString = months > 0 ? `${months} Months ` : "";

  return yearsString + monthsString;
};

module.exports = getAssociatedUsers;
