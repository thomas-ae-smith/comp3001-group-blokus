// Define the views used by blokus
(function ($, _, Backbone) {
	var GameBoard = Backbone.View.extend({
		className: "gameboard",

		paper: undefined,

		drawPlayer: function (x, y, name) {
			this.paper.rect(x, y, 250, 110, 5).attr("fill", "#E3EEF2");
			this.paper.text(x + 8, y + 10, name).attr({
				"text-anchor": "start",
				"font-family": "Tahoma",
				"font-weight": "bold",
				"font-size": 14
			});
		},

		render: function () {
			var this_ = this;
			// Reset element
			$(this.el).html("");

			this.paper = Raphael(this.el, 800, 600);

			// Player list with pieces
			var y = 30;
			this.options.players.each(function (player) {
				this_.drawPlayer(10, y, player.get("name"));
				y += 120;
			});
			
			// Gameboard
			this.paper.rect(290, 10, 510, 510, 5).attr("fill", "#GGGGGG");
			this.paper.rect(295, 15, 500, 500).attr("fill", "#AAAAAA");

			return this;
		}
	});

	_(window.blokus).extend({
		GameBoard: GameBoard
	});
}(jQuery, _, Backbone));