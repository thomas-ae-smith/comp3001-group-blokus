(function ($, _, Backbone, blokus) {
	var offsets = [
		{ x: 0, y: 60 },
		{ x: 670, y: 60 },
		{ x: 670, y: 260 },
		{ x: 670, y: 460 },
	];
	blokus.PlayerPanel = Backbone.View.extend({
		className: "playerpanel",

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

		renderPieces: function (pieces, canMove) {
			var gameview = this.options.gameview,
				cellSize = this.options.cellSize,
				colour = this.options.player.get("colour"),
				scale = this.options.active ? 0.8 : 0.3,
				$el = $(this.el),
				offset = offsets[this.options.positionId],
				width = 130,
				height = this.options.active ? 600 : 200,
				positions = blokus.utils.get_points(blokus.pieceMasters.toJSON(), offset.x + 10, offset.y + 35, width - 27, height - 20);

			pieces.each(function (piece) {
				var pieceMaster = blokus.pieceMasters.get(piece.get("master_id")),
					i = pieceMaster.get("id");
				gameview.drawPiece(positions[i].x, positions[i].y, piece, colour, scale, scale, canMove);
			});
		}
	});
}(jQuery, _, Backbone, blokus));
