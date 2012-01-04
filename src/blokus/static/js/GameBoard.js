(function ($, _, Backbone, blokus) {
	var offset = { x: 172, y: 75 },
		border = 1;

	blokus.GameBoard = Backbone.View.extend({
		className: "gameboard",

		render: function () {
			var paper = this.options.paper,
				cellSize = this.options.cellSize,
				cols = [];

			// Render 20x20 grid
			for (var x = 0; x < 20; x++) {
				var row = [];
				cols.push(row);
				for (var y = 0; y < 20; y++) {
					var cell = paper.rect(offset.x + x * cellSize, 
							offset.y + y * cellSize, 
							cellSize - border, 
							cellSize - border, 
							0);
					cell.attr("fill", "#GGG");
					row.push(cell);
				}
			}
			return this;
		},

		renderPieces: function (colour, pieces) {
			var gameview = this.options.gameview,
				cellSize = this.options.cellSize;

			pieces.each(function (piece) {
				var x = offset.x + piece.get("x") * cellSize,
					y = offset.y + piece.get("y") * cellSize,
					pieceMaster = blokus.pieceMasters.get(piece.get("pieceMasterId"));
				
				gameview.drawPiece(x, y, pieceMaster.get("data"), colour, 1, 1);
			});
		}
	});
}(jQuery, _, Backbone, blokus));
