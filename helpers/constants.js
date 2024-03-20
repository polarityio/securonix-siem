const POSSIBLE_TIME_KEYS = ['eventtime', 'datetime'];
const POSSIBLE_USER_KEYS = ['u_workemail', 'sourceusername', 'accountname', 'tenantname'];

const MAX_AUTH_RETRIES = 15;

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
  'u_lanid'
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
  ],
  username: [
    ...CONSISTENT_VIOLATION_KEYS,
    'resourcename',
    'deviceaction',
    'ipaddress',
    'rg_name'
  ],
  hostname: [
    ...CONSISTENT_VIOLATION_KEYS,
    'resourcename',
    'deviceaction',
    'ipaddress',
    'rg_name'
  ]
};

const QUERY_KEYS = {
  violation: {
    ip: ['ipaddress'],
    email: ['workemail'],
    domain: ['emailsenderdomain', 'sourcentdomain', 'destinationhostname', 'requesturl'],
    string: ['employeeid', 'accountname', 'lanid', 'sourceusername'],
    username: [
      'employeeid',
      'accountname',
      'lanid',
      'sourceusername',
      'accountname',
      'tenantname'
    ],
    hostname: ['emailsenderdomain', 'sourcentdomain', 'destinationhostname', 'requesturl']
  },
  activity: {
    ip: ['ipaddress'],
    email: ['workemail'],
    domain: ['emailsenderdomain', 'sourcentdomain', 'destinationhostname']
  },
  users: {
    email: ['workemail']
  },
  tpi: {
    ip: ['tpi_ip', 'tpi_domain']
  },
  riskscore: {
    email: ['workemail'],
    ip: ['entityid']
  },
  asset: {
    // hostname: [],
    ip: ['key_ip']
  }
};

const INCIDENT_QUERY_PATHS = [
  'violatorText',
  'violatorId',
  'assignedUser',
  'tenantInfo.tenantname'
];

const QUERY_SORT_KEYS = {
  violations: {
    direction: 'desc',
    sortKey: 'violationCount',
    maxResultCount: 40
  },
  users: {
    direction: 'desc',
    sortKey: 'violationCount',
    maxResultCount: 40
  }
};

const TIME_FOR_TOKEN_DAYS = 365;

const INCIDENT_PAGE_SIZE = 500;

// The minimum allowed value by the Securonix REST API is currently 300
// Setting the value lower than 300 causes the default max to be used which
// is 1000
const MAX_ACTIVITY_EVENTS = 300;

module.exports = {
  ASSOCIATED_USER_KEYS,
  VIOLATION_KEYS,
  QUERY_KEYS,
  TIME_FOR_TOKEN_DAYS,
  POSSIBLE_TIME_KEYS,
  POSSIBLE_USER_KEYS,
  INCIDENT_QUERY_PATHS,
  INCIDENT_PAGE_SIZE,
  QUERY_SORT_KEYS,
  MAX_AUTH_RETRIES,
  MAX_ACTIVITY_EVENTS
};
