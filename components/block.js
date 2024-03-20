polarity.export = PolarityComponent.extend({
  details: Ember.computed.alias('block.data.details'),
  timezone: Ember.computed('Intl', function () {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }),
  // number of violations to show per page
  itemsPerPage: 5,
  watchListHasBeenCalled: false,
  tabNames: ['violations', 'associatedUsers', 'users', 'riskscore', 'tpi', 'activity'],
  watchLists: null,
  expandableTitleStates: {
    allFields: {},
    datetime: {}
  },
  pagedViolations: Ember.computed(
    'details.violations',
    'block._state.violation.endItem',
    'block._state.violation.startItem',
    function () {
      let originalViolations = this.get('details.violations');
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

      this.set('block._state.activity', {});
      this.set('block._state.activity.startItem', 1);
      this.set('block._state.activity.endItem', this.get('itemsPerPage'));
      this.set('block._state.activity.pageNumber', 1);

      let initialTab = this.tabNames
        .filter((tabName) => this.get(`details.${tabName}.length`))
        .shift();
      if(!initialTab){
        // no other tabs so default to activity
        initialTab = 'activity';
      }
      this.set('block._state.activeTab', initialTab);

      if(this.get('details.activity.events')){
        this.initActivityTabs();
      }
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
      const totalItems = this.get('details.violations.length');
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
    },
    toggleActivityViewer: function (index) {
      this.toggleProperty('details.activity.events.' + index + '.__expanded');
      const isExpanded = this.get('details.activity.events.' + index + '.__expanded');
      const showJson = this.get('details.activity.events.' + index + '.__showJson');
      const showTable = this.get('details.activity.events.' + index + '.__showTable');
      if (isExpanded && !showJson && !showTable) {
        this.set('details.activity.events.' + index + '.__showTable', true);
      } else if (!isExpanded) {
        this.set('details.activity.events.' + index + '.__showJson', false);
        this.set('details.activity.events.' + index + '.__showTable', false);
      }
    },
    showActivityTable: function (index) {
      this.set('details.activity.events.' + index + '.__showTable', true);
      this.set('details.activity.events.' + index + '.__showJson', false);
      this.set('details.activity.events.' + index + '.__expanded', true);
    },
    showActivityJson: function (index) {
      if (
        typeof this.get('details.activity.events.' + index + '.__json') === 'undefined'
      ) {
        this.set(
          'details.activity.events.' + index + '.__json',
          this.syntaxHighlight(
            JSON.stringify(this.get('details.activity.events.' + index), null, 4)
          )
        );
      }
      this.set('details.activity.events.' + index + '.__showTable', false);
      this.set('details.activity.events.' + index + '.__showJson', true);
      this.set('details.activity.events.' + index + '.__expanded', true);
    }
  },
  initActivityTabs() {

    this.get('details.activity.events').forEach((result, index) => {
      if (index !== 0) {
        Ember.set(result, '__showTable', false);
        Ember.set(result, '__showJson', false);
        Ember.set(result, '__expanded', false);
      } else {
        Ember.set(result, '__showTable', true);
        Ember.set(result, '__showJson', false);
        Ember.set(result, '__expanded', true);
      }
    });
  },
  syntaxHighlight(json) {
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      function (match) {
        var cls = 'number';
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = 'key';
          } else {
            cls = 'string';
          }
        } else if (/true|false/.test(match)) {
          cls = 'boolean';
        } else if (/null/.test(match)) {
          cls = 'null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
      }
    );
  }
});
