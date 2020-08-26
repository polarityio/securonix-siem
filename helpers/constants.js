const ASSOCIATED_USER_KEYS = [
  "u_workemail",
  "u_fullname",
  "u_preferredname",
  "u_riskscore",
  "riskthreatname",
  "policyname",
  "u_criticality",
  "u_division",
  "u_department",
  "u_title",
  "u_workphone",
  "u_country",
  "u_location",
  "u_timezoneoffset",
  "u_hiredate",
  "u_employeetypedescription",
  "u_statusdescription",
  "u_employeeid",
  "accountname",
  "u_lanid",
  "sourceusername"
];

const CONSISTENT_VIOLATION_KEYS = [
  "eventtime",
  "eventoutcome",
  "riskthreatname",
  "category",
  "policyname",
  "u_workemail",
  "filename",
  "requesturl",
  "emailsenderdomain",
  "sourcentdomain"
];

const VIOLATION_KEYS = {
  email: [...CONSISTENT_VIOLATION_KEYS, "ipaddress", "oldfilepath"],
  ip: [
    ...CONSISTENT_VIOLATION_KEYS,
    "resourcename",
    "deviceaction",
    "requesturl",
    "eventcountry",
    "eventcity"
  ],
  domain: [
    ...CONSISTENT_VIOLATION_KEYS,
    "resourcename",
    "deviceaction",
    "ipaddress",
    "rg_name"
  ],
  string: [
    ...CONSISTENT_VIOLATION_KEYS,
    "resourcename",
    "deviceaction",
    "ipaddress",
    "rg_name"
  ],
};

const QUERY_KEYS = {
  ip: ["ipaddress"],
  email: ["workemail"],
  domain: [
    "emailsenderdomain",
    "sourcentdomain",
    "destinationhostname",
    "requesturl",
  ],
  string: ["employeeid", "accountname", "lanid", "sourceusername"]
};

const TIME_FOR_TOKEN_DAYS = 365;

module.exports = {
  ASSOCIATED_USER_KEYS,
  VIOLATION_KEYS,
  QUERY_KEYS,
  TIME_FOR_TOKEN_DAYS
};
