blokus.ForgotView = Backbone.View.extend({
	render: function () {
		var template = _.template($('#forgot-template').html());
		$(this.el).html(template());
		return this;
	}
});