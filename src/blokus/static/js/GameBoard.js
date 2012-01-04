(function ($, _, Backbone, blokus) {
	blokus.GameBoard = Backbone.View.extend({
		className: "gameboard",

		render: function () {
			var paper = this.options.paper,
				cols = [],
				border = 1,
				offset = { x: 172, y: 75 };
				console.log(paper)

			// Render 20x20 grid
			for (var x = 0; x < 20; x++) {
				var row = [];
				cols.push(row);
				for (var y = 0; y < 20; y++) {
					var cell = paper.rect(offset.x + x * 22, offset.y + y * 22, 22 - border, 22 - border);
					cell.attr("fill", "#GGG");
					row.push(cell);
				}
			}
			return this;
		},

		renderPieces: function (colour, pieces) {
			
		}
	});
}(jQuery, _, Backbone, blokus));
