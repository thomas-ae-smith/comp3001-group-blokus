blokus.RegisterView = Backbone.View.extend({
	render: function () {
		var template = _.template($('#register-template').html());
		$(this.el).html(template());
		return this;
	}
});