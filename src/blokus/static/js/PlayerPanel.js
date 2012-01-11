(function ($, _, Backbone, blokus) {
	var _offsets = [
		{ x: 0, y: 95 },
		{ x: 670, y: 95 },
		{ x: 670, y: 295 },
		{ x: 670, y: 495 },
	];
	var _dimensions = [
		{ w: 132, h: 565 },
		{ w: 132, h: 135 },
		{ w: 132, h: 135 },
		{ w: 132, h: 135 }
	];
	blokus.PlayerPanel = Backbone.View.extend({
		className: "playerpanel",
		shapes: {},
		pos: 0,

		render: function () {
			var $el = $(this.el),
				player = this.options.player,
				template = blokus.getTemplate("player-panel");

			var profile = player.user.get("userprofile");
			$el.html(template({
				name: player.user.get("username"),
				pic: "/static/img/noavatar.jpg",
				stats: profile != null ? "wins: " + profile.wins + " losses: " + profile.losses : ""
			}));

			return this;
		},

		setPosition: function (pos) {
			this.pos = pos;
			if (pos === 0) {
				$(".playerpanelcontainer.left").append(this.el);
			} else {
				$(".playerpanelcontainer.right").append(this.el);
			}
			var boundaries = this.getBoundaries();
			this.shapePositions = blokus.utils.makePositionArray(boundaries.sx, boundaries.sy, boundaries.width, boundaries.height);
		},

		getPosition: function () { return this.pos; },

		isActive: function () { return this.pos === 0 },

		isOpponent: function () { return gameview.game.players.at(0).get("user_id") != blokus.user.get("id"); },

		getBoundaries: function () {
			var offsets = _offsets[this.pos],
				dimensions = _dimensions[this.pos];
			return {
				sx: offsets.x,
				sy: offsets.y,
				ex: offsets.x + dimensions.w,
				ey: offsets.y + dimensions.h,
				width: dimensions.w,
				height: dimensions.h
			};
		}

	});
}(jQuery, _, Backbone, blokus));
