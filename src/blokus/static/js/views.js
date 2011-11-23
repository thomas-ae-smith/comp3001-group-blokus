// Define the views used by blokus
(function ($, _, Backbone) {
	var GameBoard = Backbone.View.extend({
		className: "gameboard",

		paper: undefined,

		drawPlayer: function (x, y, player) {
			var user = blokus.users.get(player.userId).toJSON();
			this.paper.rect(x, y, 250, 110, 5).attr("fill", "#E3EEF2");
			this.paper.text(x + 8, y + 10, user.name + " (" + player.colours.join(", ") + ")").attr({
				"text-anchor": "start",
				"font-family": "Tahoma",
				"font-weight": "bold",
				"font-size": 14
			});
		},

		drawBoard: function (x, y, width, height) {
			// Gameboard
			this.paper.rect(x, y, width+10, height+10, 5).attr("fill", "#GGGGGG");
			this.paper.rect(x+5, y+5, width, height).attr("fill", "#AAAAAA");
			var cellXSize = width/20;
			var cellYSize = height/20;
			for (var i = x+5+cellXSize; i<=width+x ; i+=cellXSize) {
				this.paper.path("M"+i+","+(y+5)+"L"+i+","+(height+y+5)+"z");
			}
			for (var j = y+5+cellYSize; j<=height+y ; j+=cellYSize) {
				this.paper.path("M"+(x+5)+","+j+"L"+(x+width+5)+","+j+"z");
			}
		}, 

		render: function () {
			var this_ = this;
			// Reset element
			$(this.el).html("");

			// Make the Raphael element 800 x 600 in this view
			this.paper = Raphael(this.el, 800, 600);

			// Player list with pieces
			var y = 30;
			this.options.game.get("players").each(function (player) {
				this_.drawPlayer(10, y, player.toJSON());
				y += 120;
			});

			this.drawBoard(290, 10, 500, 500);

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
			$.fn.append.apply($el, this.options.games.map(function (game) {
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
