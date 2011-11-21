// Define the views used by blokus
(function ($, _, Backbone) {
	var GameBoard = Backbone.View.extend({
		className: "gameboard",

		paper: undefined,

		drawPlayer: function (x, y, player) {
			this.paper.rect(x, y, 250, 110, 5).attr("fill", "#E3EEF2");
			this.paper.text(x + 8, y + 10, player.name).attr({
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

			// Make the Raphael element 800 x 600 in this view
			this.paper = Raphael(this.el, 800, 600);

			// Player list with pieces
			var y = 30;
			this.options.players.each(function (player) {
				this_.drawPlayer(10, y, player.toJSON());
				y += 120;
			});

			// Gameboard
			this.paper.rect(290, 10, 510, 510, 5).attr("fill", "#GGGGGG");
			this.paper.rect(295, 15, 500, 500).attr("fill", "#AAAAAA");

			return this;
		}
	});

	var GameList = Backbone.View.extend({
		tagName: "url",
		className: "lobbylist",

		$items: undefined,

		render: function () {
			var this_ = this,
				$el = $(this.el);

			this.$items = [];

			// Reset element
			$el.html("");

			// Render li tag for each game
			$.fn.append.apply($el, this.options.gameCollection.map(function (game) {
				var $item = this_.$items[game.get("id")] = $('<li><a href="javascript:;">' + 
					game.get("name") + '</a></li>');
				
				$item.click(function () {
					this_.selectItem(game);
				});

				return $item;
			}));

			return this;
		},

		selectItem: function (game) {
			var $item = this.$items[game.get("id")];
			$item.find("a").addClass("sel");
			$item.siblings().find("a").removeClass("sel");
		}
	});

	_(window.blokus).extend({
		GameBoard: GameBoard,
		GameList: GameList
	});
}(jQuery, _, Backbone));