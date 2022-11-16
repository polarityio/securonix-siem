polarity.export = PolarityComponent.extend({
  details: Ember.computed.alias('block.data.details'),
  timezone: Ember.computed('Intl', function () {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }),
  watchListHasBeenCalled: false,
  tabNames: ['violation', 'associatedUsers', 'users', 'riskscore', 'tpi'],
  watchLists: null,
  activeTab: '',
  expandableTitleStates: {
    allFields: {},
    datetime: {}
  },
  init () {
    const activeTab = this.tabNames
      .filter((tabName) => this.get(`details.${tabName}.length`))
      .shift();

    this.set('activeTab', activeTab);

    this._super(...arguments);
  },
  actions: {
    changeTab: function (tabName) {
      this.set('activeTab', tabName);
    },
    toggleExpandableTitle: function (index, type) {
      const modifiedExpandableTitleStates = Object.assign(
        {},
        this.get(`expandableTitleStates.${type}`),
        {
          [index]: !this.get(`expandableTitleStates.${type}`)[index]
        }
      );
      this.set(`expandableTitleStates.${type}`, modifiedExpandableTitleStates);
    }
  }
});
