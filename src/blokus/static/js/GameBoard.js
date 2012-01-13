(function ($, _, Backbone, blokus) {

	blokus.GameBoard = Backbone.View.extend({
		offset: { x: 175, y: 125 },
		borderWidth: 30,
		width: undefined,
		height: undefined,
		cellSize: undefined,
		border: 1,
		className: "gameboard",
		grid: undefined,

		initialize: function(){
			this.cellSize = this.options.cellSize;
			this.width = this.cellSize * 20;
			this.height = this.cellSize * 20;
		},

		render: function () {
			var paper = this.options.paper,
				cellSize = this.options.cellSize,
				cols = [];
			this.grid = new Array(20);
			// Render the border
			paper.rect(this.offset.x - this.borderWidth, this.offset.y - this.borderWidth, this.width + this.borderWidth * 2,this.height + this.borderWidth * 2, 10)
				 .attr("fill", "url('/static/img/wood.jpg')").glow();
			// Render the background
			paper.rect(this.offset.x, this.offset.y, this.width, this.height)
				 .attr("fill", "url('/static/img/wood_light.jpg')").glow();
			// Render the inset border
			paper.rect(this.offset.x, this.offset.y, this.width, this.height)
				 .attr("stroke", "black").glow();

			// Render 20x20 grid
			for (var x = 0; x < 20; x++) {
				var row = [];
				cols.push(row);
				for (var y = 0; y < 20; y++) {
					var cell = paper.rect(this.offset.x + x * cellSize, this.offset.y + y * cellSize, cellSize - this.border, cellSize - this.border);
					cell.attr("fill", "#GGG");
					row.push(cell);
				}
				this.grid[x] = row;
			}
			return this;
		},

		makeTransparent: function(){
			for (var x = 0; x < 20; x++) {
				for (var y = 0; y < 20; y++) {
					this.grid[x][y].attr("fill", "#GGG");
				}
			}
		}
	});
}(jQuery, _, Backbone, blokus));
