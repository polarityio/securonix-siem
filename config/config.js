module.exports = {
  name: 'Securonix',
  acronym: 'SX',
  description:
    'The Securonix Integration connects to their api to find user Violation information',
  entityTypes: ['ipv4', 'email', 'domain', 'string'],
  styles: ['./styles/styles.less'],
  defaultColor: 'light-purple',
  onDemandOnly: true,
  block: {
    component: {
      file: './components/block.js'
    },
    template: {
      file: './templates/block.hbs'
    }
  },
  summary: {
    component: {
      file: './components/summary.js'
    },
    template: {
      file: './templates/summary.hbs'
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
    level: 'info' //trace, debug, info, warn, error, fatal
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
      name: 'Valid Username',
      description: 'Valid Securonix Username',
      default: '',
      type: 'text',
      userCanEdit: true,
      adminOnly: false
    },
    {
      key: 'password',
      name: 'Valid Password',
      description: 'Valid Securonix Password',
      default: '',
      type: 'password',
      userCanEdit: true,
      adminOnly: false
    },
    {
      key: 'searchForEmployeeId',
      name: 'Search For Employee ID',
      description:
        'Allows you to search Securonix using Employee IDs found in Allowlisted Channels.',
      default: false,
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
