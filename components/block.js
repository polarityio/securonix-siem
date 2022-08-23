polarity.export = PolarityComponent.extend({
  details: Ember.computed.alias('block.data.details'),
  timezone: Ember.computed('Intl', function () {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }),
  watchListHasBeenCalled: false,
  watchLists: null,
  activeTab: 'violations',
  expandableTitleStates: {
    allFields: {},
    datetime: {},
    watchList: {}
  },
  init () {
    if (this.get('details.violations') && !this.get('details.violations').length)
      this.set('activeTab', 'incidents');

    this._super(...arguments);
  },
  actions: {
    changeTab: function (tabName) {
      this.set('activeTab', tabName);
    },
    toggleExpandableTitle: function (index, type) {
      if (type === 'watchList' && !this.watchListHasBeenCalled) {
        this.getWatchLists();
      }
      const modifiedExpandableTitleStates = Object.assign(
        {},
        this.get(`expandableTitleStates.${type}`),
        {
          [index]: !this.get(`expandableTitleStates.${type}`)[index]
        }
      );
      this.set(`expandableTitleStates.${type}`, modifiedExpandableTitleStates);
    }
  },
  getWatchLists: function () {
    this.sendIntegrationMessage({
      action: 'getWatchLists'
    })
      .then((response) => {
        this.set('watchLists', response.body.result);
      })
      .catch((err) => {
        // set message
      })
      .finally(() => {
        this.set('watchListHasBeenCalled', true);
      });
  }
});
