(function ($, _, Backbone, blokus) {
	
	blokus.shape = Backbone.View.extend({

		// initial Boundary box
		initBBox: {
				x:undefined,
				y:undefined,
				width: undefined,
				height: undefined
		},

		curScale: {
			sx: undefined,
			sy: undefined,
			originalScale: undefined,
		},

		isSelected: false,
		rotation: 0,
		cells: undefined, //The set of cells or squares
		dataArr: undefined, // The array of 0 or 1s which define the shape
		destCor: {
			x: undefined,
			y: undefined
		},
		returnToPanel: false,

		prevDist: {
			x: undefined,
			y: undefined
		}

		mousePage: {
			x: undefined,
			y: undefined
		}

		// gameboard boundary box
		gameboardBBox: {
			sx: undefined, // start x
			sy: undefined, // start y
			width: undefined, 
			height: undefined,
			ex: undefined, // end x
			ey: undefined  // end y
		},

		gameboardCellSize: undefined,

		// current Boundary box
		curBBox: {
			x: undefined,
			y: undefined,
			width: undefined,
			height: undefined,
			ex: undefined,
			ey: undefined
		},
		
		initialize: function(){
		},

		render: function (){
		},

		isShapeInGameboard: function () {
			if (this.curBBox.x >= this.gameboardBBox.sx &&
				this.curBBox.y >= this.gameboardBBox.sy &&
				this.curBBox.ex - this.gameboardCellSize < this.gameboardBBox.ex &&
				this.curBBox.ey - this.gameboardCellSize < this.gameboardBBox.ey) {
				return true;
			}
			else{
				return false;
			}
		}

	});


}(jQuery, _, Backbone, blokus));
