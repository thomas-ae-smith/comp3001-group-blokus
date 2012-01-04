(function ($, _, Backbone, blokus) {
	blokus.PlayerPanel = Backbone.View.extend({
		className: "playerpanel",
		active: false,

		render: function () {
			var $el = $(this.el),
				player = this.options.player;
			
			if (this.options.active) {
			}

			$el.html("Name: " + player.user.get("name") + ", Colour: " + this.options.colour);

			return this;
		},

		renderPieces: function (pieces) {
			_(pieces).each(function () {
				$(this.el).append("Piece")
			})
		}
	});
}(jQuery, _, Backbone, blokus));
