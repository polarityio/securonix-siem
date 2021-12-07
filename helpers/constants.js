const POSSIBLE_TIME_KEYS = ['eventtime', 'datetime'];
const POSSIBLE_USER_KEYS = ['u_workemail', 'sourceusername', 'accountname', 'tenantname'];

const ASSOCIATED_USER_KEYS = [
  ...POSSIBLE_USER_KEYS,
  'u_fullname',
  'u_preferredname',
  'u_riskscore',
  'u_criticality',
  'u_division',
  'u_department',
  'u_title',
  'u_workphone',
  'u_country',
  'u_location',
  'u_timezoneoffset',
  'u_hiredate',
  'u_employeetypedescription',
  'u_statusdescription',
  'u_employeeid',
  'u_lanid',
];

const CONSISTENT_VIOLATION_KEYS = [
  ...POSSIBLE_TIME_KEYS,
  ...POSSIBLE_USER_KEYS,
  'eventoutcome',
  'riskthreatname',
  'category',
  'policyname',
  'filename',
  'requesturl',
  'emailsenderdomain',
  'sourcentdomain'
];

const VIOLATION_KEYS = {
  email: [...CONSISTENT_VIOLATION_KEYS, 'ipaddress', 'oldfilepath'],
  ip: [
    ...CONSISTENT_VIOLATION_KEYS,
    'resourcename',
    'deviceaction',
    'requesturl',
    'eventcountry',
    'eventcity'
  ],
  domain: [
    ...CONSISTENT_VIOLATION_KEYS,
    'resourcename',
    'deviceaction',
    'ipaddress',
    'rg_name'
  ],
  string: [
    ...CONSISTENT_VIOLATION_KEYS,
    'resourcename',
    'deviceaction',
    'ipaddress',
    'rg_name'
  ]
};

const QUERY_KEYS = {
  ip: ['ipaddress'],
  email: ['workemail'],
  domain: ['emailsenderdomain', 'sourcentdomain', 'destinationhostname', 'requesturl'],
  string: ['employeeid', 'accountname', 'lanid', 'sourceusername']
};

const TIME_FOR_TOKEN_DAYS = 365;

module.exports = {
  ASSOCIATED_USER_KEYS,
  VIOLATION_KEYS,
  QUERY_KEYS,
  TIME_FOR_TOKEN_DAYS,
  POSSIBLE_TIME_KEYS,
  POSSIBLE_USER_KEYS
};
