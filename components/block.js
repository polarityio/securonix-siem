polarity.export = PolarityComponent.extend({
  details: Ember.computed.alias('block.data.details'),
  timezone: Ember.computed('Intl', function () {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }),
  activeTab: 'violations',
  expandableTitleStates: {
    allFields: {},
    datetime: {}
  },
  init() {
    if (this.get('details.violations') && !this.get('details.violations').length)
      this.set('activeTab', 'incidents');

    this._super(...arguments);
  },
  actions: {
    changeTab: function (tabName) {
      this.set('activeTab', tabName);
    },
    toggleExpandableTitle: function (index, type) {
      console.log({ index, type });
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
