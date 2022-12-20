polarity.export = PolarityComponent.extend({
  details: Ember.computed.alias('block.data.details'),
  timezone: Ember.computed('Intl', function () {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }),
  // number of violations to show per page
  itemsPerPage: 5,
  watchListHasBeenCalled: false,
  tabNames: ['violation', 'associatedUsers', 'users', 'riskscore', 'tpi'],
  watchLists: null,
  expandableTitleStates: {
    allFields: {},
    datetime: {}
  },
  pagedViolations: Ember.computed(
    'details.violation',
    'block._state.violation.endItem',
    'block._state.violation.startItem',
    function () {
      let originalViolations = this.get('details.violation');
      let itemsPerPage = this.get('itemsPerPage');
      let pageNumber = this.get('block._state.violation.pageNumber');
      let slicedViolations;

      slicedViolations = originalViolations.slice(
        this.get('block._state.violation.startItem') - 1,
        this.get('block._state.violation.endItem')
      );

      slicedViolations.forEach((violation, index) => {
        violation.index = (pageNumber - 1) * itemsPerPage + (index + 1);
      });

      return slicedViolations;
    }
  ),
  init() {
    if (!this.get('block._state')) {
      this.set('block._state', {});
      this.set('block._state.violation', {});
      this.set('block._state.violation.startItem', 1);
      this.set('block._state.violation.endItem', this.get('itemsPerPage'));
      this.set('block._state.violation.pageNumber', 1);

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
    },
    changePage(value) {
      const perPage = this.get('itemsPerPage');
      const pageNumber = this.get('block._state.violation.pageNumber');
      const totalItems = this.get('details.violation.length');
      const minPage = 1;
      const maxPage = Math.ceil(totalItems / perPage);
      let tempPageNumber;
      if (value === 'firstPage') {
        tempPageNumber = 1;
      } else if (value === 'lastPage') {
        tempPageNumber = maxPage;
      } else {
        tempPageNumber = pageNumber + value;
      }

      // Can't go below min page (1) or above max page
      if (tempPageNumber < minPage || tempPageNumber > maxPage) {
        return;
      }

      const startItem = (tempPageNumber - 1) * perPage + 1;
      const endItem =
        tempPageNumber * perPage > totalItems ? totalItems : tempPageNumber * perPage;

      this.set('block._state.violation.startItem', startItem);
      this.set('block._state.violation.endItem', endItem);
      this.set('block._state.violation.pageNumber', tempPageNumber);
    }
  }
});
