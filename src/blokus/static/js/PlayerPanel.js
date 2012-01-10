(function ($, _, Backbone, blokus) {
	var offsets = [
		{ x: 0, y: 60 },
		{ x: 670, y: 60 },
		{ x: 670, y: 260 },
		{ x: 670, y: 460 },
	];
	var dimensions = [
		{ w: 132, h: 570 },
		{ w: 132, h: 170 },
		{ w: 132, h: 170 },
		{ w: 132, h: 170 }
	];
	blokus.PlayerPanel = Backbone.View.extend({
		className: "playerpanel",
		shapes: {},
		pos: 0,

		render: function () {
			var $el = $(this.el),
				player = this.options.player,
				template = _.template($('#player-panel-template').html());

			$el.html(template({
				name: player.user.get("username"),
				pic: "/static/img/noavatar.jpg",
				stats: "wins: 0 losses: 0"
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
		},

		getPosition: function () { return pos; },

		isActive: function () { return pos === 0 },

		getBoundaries: function () {
			var offsets = offsets[this.pos],
				dimensions = dimensions[this.pos];
			return {
				sx: offsets.x,
				sy: offsets.y,
				ex: offsets.x + dimensions.w,
				ey: offsets.y + dimensions.h,
				width: dimensions.w,
				height: dimensions.h
			};
		},

		renderPieces: function (pieces, canMove) {
			var this_ = this,
				gameview = this.options.gameview,
				cellSize = this.options.cellSize,
				colour = this.options.player.get("colour"),
				scale = this.options.active ? 0.6 : 0.3,
				$el = $(this.el),
				offset = offsets[this.options.positionId],
				width = 130,
				height = this.options.active ? 600 : 200,
				positions = blokus.utils.get_points(blokus.pieceMasters.toJSON(), offset.x + 20, offset.y + 35, width - 27, height - 20);

			pieces.each(function (piece) {
				var master_id = piece.get("master_id"),
					pieceMaster = blokus.pieceMasters.get(master_id),
					i = pieceMaster.get("id");
				var shape = gameview.drawPiece(positions[i].x, positions[i].y, piece, colour, scale, scale, canMove);
				this_.shapes[master_id] = shape;
			});
		},

	});
}(jQuery, _, Backbone, blokus));
