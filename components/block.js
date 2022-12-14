polarity.export = PolarityComponent.extend({
  details: Ember.computed.alias('block.data.details'),
  timezone: Ember.computed('Intl', function () {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }),
  watchListHasBeenCalled: false,
  tabNames: ['violation', 'associatedUsers', 'users', 'riskscore', 'tpi'],
  watchLists: null,
  expandableTitleStates: {
    allFields: {},
    datetime: {}
  },
  init() {
    if (!this.get('block._state')) {
      this.set('block._state', {});
      const initialTab = this.tabNames
        .filter((tabName) => this.get(`details.${tabName}.length`))
        .shift();
      this.set('block._state.activeTab', initialTab);
    }

    this._super(...arguments);
  },
  actions: {
    changeTab: function (tabName) {
      this.set('block._state.activeTab', tabName);
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
