(function ($, _, Backbone, blokus) {
	var offsets = [
		{ x: 0, y: 0 },
		{ x: 670, y: 0 },
		{ x: 670, y: 200 },
		{ x: 670, y: 400 },
	];
	blokus.PlayerPanel = Backbone.View.extend({
		className: "playerpanel",
		active: false,

		render: function () {
			var $el = $(this.el),
				player = this.options.player,
				template = _.template($('#player-panel-template').html());

			$el.html(template({
				name: player.user.get("name"),
				wins: 10,
				losses: 4
			}));

			return this;
		},

		renderPieces: function (pieces) {
			var gameview = this.options.gameview,
				cellSize = this.options.cellSize,
				colour = this.options.player.get("colour"),
				scale = this.active ? 0.4 : 0.3,
				$el = $(this.el),
				offset = offsets[this.options.positionId],
				width = 130,
				height = this.active ? 600 : 200,
				positions = blokus.utils.get_points(blokus.pieceMasters.toJSON(), offset.x + 10, offset.y + 35, width - 27, height - 20);

			pieces.each(function (piece) {
				var x = offset.x + piece.get("x") * cellSize,
					y = offset.y + piece.get("y") * cellSize,
					pieceMaster = blokus.pieceMasters.get(piece.get("pieceMasterId")),
					i = pieceMaster.get("id");
				gameview.drawPiece(positions[i].x, positions[i].y, pieceMaster.get("data"), colour, 0.3, 0.3);
			});
		}
	});
}(jQuery, _, Backbone, blokus));
