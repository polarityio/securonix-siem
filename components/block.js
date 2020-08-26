polarity.export = PolarityComponent.extend({
  details: Ember.computed.alias("block.data.details"),
  activeTab: "violations",
  actions: {
    changeTab: function(tabName) {
      this.set("activeTab", tabName);
    }
  }
});
