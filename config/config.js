module.exports = {
  name: 'Securonix',
  acronym: 'SX',
  description:
    'Search Securonix for User Violation and Activity (Event) information on Emails, Domains, and IPs',
  entityTypes: [
    'IPv4',
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
    proxy: ''
  },
  logging: {
    level: 'info' //trace, debug, info, warn, error, fatal
  },
  options: [
    {
      key: 'url',
      name: 'URL',
      description:
        'The base URL for the Securonix API including the schema (i.e., https://)',
      default: '',
      type: 'text',
      userCanEdit: false,
      adminOnly: false
    },
    {
      key: 'username',
      name: 'Username',
      description: 'Valid Securonix Username',
      default: '',
      type: 'text',
      userCanEdit: false,
      adminOnly: true
    },
    {
      key: 'password',
      name: 'Password',
      description: 'Password for the provided Securonix username',
      default: '',
      type: 'password',
      userCanEdit: false,
      adminOnly: true
    },
    {
      key: 'searchCategories',
      name: 'Search Categories',
      description: 'Select one or more categories to search',
      default: [
        { display: 'Violations', value: 'violations' },
        { display: 'TPI', value: 'tpi' },
        { display: 'Users', value: 'users' },
        { display: 'Risk Score', value: 'riskscore' }
      ],
      type: 'select',
      options: [
        { display: 'Violations', value: 'violations' },
        { display: 'TPI', value: 'tpi' },
        { display: 'Users', value: 'users' },
        { display: 'Risk Score', value: 'riskscore' },
        { display: 'Activity (Events)', value: 'activity' }
      ],
      multiple: true,
      userCanEdit: false,
      adminOnly: true
    },
    {
      key: 'daysBack',
      name: 'Violation Days Back',
      description:
        'The number of days you would like to look back for violations. Supports fractional days (e.g., 0.25 would be 8 hours).  Defaults to 5 days.',
      default: 5,
      type: 'number',
      userCanEdit: false,
      adminOnly: true
    },
    {
      key: 'eventsDaysBack',
      name: 'Activity (Events) Days Back',
      description:
        'The number of days you would like to look back for activity (events). Supports fractional days (e.g., 0.25 would be 8 hours).  It is not recommended to search back more than 7 days.',
      default: 1,
      type: 'number',
      userCanEdit: false,
      adminOnly: true
    },
    {
      key: 'activitySearchFilter',
      name: 'Activity (Events) Search Filter',
      description:
        'A filter you would like to apply to the Activity search.  For example, it\'s recommended to filter by "resourcegroupname" in which case the Activity Search Filter value would be `resourcegroupname="my_resource_group"`.',
      default: '',
      type: 'text',
      userCanEdit: false,
      adminOnly: true
    }
  ]
};
