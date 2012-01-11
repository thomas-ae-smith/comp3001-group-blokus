blokus.RegisterView = Backbone.View.extend({
	render: function () {
		$(this.el).html(blokus.getTemplate("register")());
		return this;
	}
});