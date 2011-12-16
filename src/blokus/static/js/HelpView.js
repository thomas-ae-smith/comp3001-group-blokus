blokus.HelpView = Backbone.View.extend({
	render: function () {
		// Use underscore templating.
		var template = _.template($('#help-template').html());
		$(this.el).html(template());
		return this;
	}
});