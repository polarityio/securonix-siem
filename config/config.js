module.exports = {
  name: 'Securonix',
  acronym: 'SX',
  description: 'Search Securonix for user Violation and Incident information',
  entityTypes: [
    'ipv4',
    'email',
    'domain'
    //,'string'
  ],
  customTypes: [
    // {
    //   key: 'username',
    //   // Replace this regex with a regex for your own username
    //   regex: /\b[A-Z]{1}[0-9]{6}\b/
    // }
    // {
    //   key: 'hostname',
    //   // Replace this regex with a regex for your own hostnames
    //   regex: /\w{3,}\-\w{3,}/
    // },
  ],
  styles: ['./styles/styles.less'],
  defaultColor: 'light-blue',
  onDemandOnly: true,
  block: {
    component: {
      file: './components/block.js'
    },
    template: {
      file: './templates/block.hbs'
    }
  },
  request: {
    cert: '',
    key: '',
    passphrase: '',
    ca: '',
    proxy: '',
    rejectUnauthorized: true
  },
  logging: {
    level: 'trace' //trace, debug, info, warn, error, fatal
  },
  options: [
    {
      key: 'url',
      name: 'Url',
      description:
        'The base URL for the Securonix API including the schema (i.e., https://)',
      default: '',
      type: 'text',
      userCanEdit: false,
      adminOnly: true
    },
    {
      key: 'username',
      name: 'Username',
      description: 'Valid Securonix Username',
      default: '',
      type: 'text',
      userCanEdit: true,
      adminOnly: false
    },
    {
      key: 'password',
      name: 'Password',
      description: 'Password for the provided Securonix username',
      default: '',
      type: 'password',
      userCanEdit: true,
      adminOnly: false
    },
    {
      key: 'searchForEmployeeId',
      name: 'Search For Employee ID',
      description:
        'If enabled, the integration will search Securonix for Employee IDs in the specified Channel.  This option should be used in conjunction with a Channel Entity Filter on the "Annotated Entities" entity type.',
      default: true,
      type: 'boolean',
      userCanEdit: true,
      adminOnly: false
    },
    {
      key: 'searchIncidents',
      name: 'Search Incidents',
      description:
        'If enabled, allows you to search Securonix for Incidents related to searched entities.',
      default: true,
      type: 'boolean',
      userCanEdit: true,
      adminOnly: false
    },
    {
      key: 'monthsBack',
      name: 'Months Back',
      description:
        'The number of months you would like to look back for violations (decimals work as well, e.g. 0.25)',
      default: 6,
      type: 'number',
      userCanEdit: true,
      adminOnly: false
    }
  ]
};
