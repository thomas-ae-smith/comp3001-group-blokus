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
		initScale: {
			sx: undefined,
			sy: undefined,
			originalScale: undefined,
		},

		isSelected: false,
		rotation: 0,
		cells: undefined, //The set of cells or squares
		pos: {x:undefined, y:undefined}, // initial position of the shape
		dataArr: undefined, // The array of 0 or 1s which define the shape
		destCor: {
			x: undefined,
			y: undefined
		},
		returnToPanel: true,

		prevDist: {
			x: undefined,
			y: undefined
		},

		mousePage: {
			x: undefined,
			y: undefined
		},

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
		cellSize: undefined,

		// current Boundary box
		curBBox: {
			x: undefined,
			y: undefined,
			width: undefined,
			height: undefined,
			ex: undefined,
			ey: undefined
		},

		// distance moved, is set during game
		distMoved: {
			x: 0,
			y: 0
		},
		
		initialize: function(){
			this.curScale = this.options.curScale;
			this.initScale = _(this.curScale).clone();
			this.cells = this.options.cells;
			this.pos = this.options.pos;
			this.dataArr = this.options.dataArr;
			this.destCor = this.options.destCor;
			this.prevDist = this.options.prevDist;
			this.mousePage = this.options.mousePage;
			this.gameboardBBox = this.options.gameboardBBox;
			this.gameboardCellSize = this.options.gameboardCellSize;
			this.cellSize = this.options.cellSize;
			this.calInitBBox();
			// Apply the current scale given
			if (this.curScale != undefined){
				this.cells.scale(this.curScale.sx, this.curScale.sy
							, this.pos.x, this.pos.y);
			}
		},

		render: function(){
			return this;
		},

		setOpacity: function(opacity, time){
			this.cells.forEach(
				function (c) {
					if (c.opacity > 0){
						c.animate({"opacity": opacity}, time);
					}
				}
			);
		},

		/** MOVEMENT **/

		calDistTravel:  function(e){
			var tmpR = Math.abs(this.rotation % 2);
			var dx = e.pageX - this.mousePageX,
				dy = e.pageY - this.mousePageY;
			if (tmpR == 0){
				dx -= this.cells.getBBox().width/2;
				dy -= this.cells.getBBox().height/2;
			}
			else{
				dx -= this.cells.getBBox().height/2;
				dy -= this.cells.getBBox().width/2;
			}
			this.distMoved = {x:dx, y:dy};
			return {dx: dx, dy:dy}
		},

		/** END MOVEMENT **/


		/** VALIDATION AND BOUNDARY BOXS **/

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
		},

		calInitBBox: function (){
			if (this.options.initBBox == undefined){
				this.initBBox = {
					x:this.pos.x,
					y:this.pos.y,
					width: this.cells.getBBox().width,
					height: this.cells.getBBox().height,
				};
				this.options.initBBox = this.initBBox; // prevent from rerun
			}
		},

		calCurBBox: function (){
			this.curBBox = {
				x: this.cells.getBBox().x,
				y: this.cells.getBBox().y,
				width: this.cells.getBBox().width,
				height: this.cells.getBBox().height,
				ex: this.cells.getBBox().x + this.cells.getBBox().width - this.gameboardCellSize,
				ey: this.cells.getBBox().y + this.cells.getBBox().height - this.gameboardCellSize,
			};
		},

		/** END VALIDATION AND BOUNDARY BOXS **/

		/** SELECT SHAPE AND RETURN TO PANEL **/

		selectShape: function (e){
			this.isSelected = true;
			this.prevDistX = 0;
			this.prevDistY = 0;
			this.mousePageX = e.pageX - e.offsetX + this.initBBox.x;
			this.mousePageY = e.pageY - e.offsetY + this.initBBox.y;
			//this.animate({"opacity": 0.5}, 0);
			this.setOpacity(0.5, 100);
		},

		returnToPanel: function (){
			this.isSelected = false;
			var rotPoint = this.centerOfRotation();
			var xrot = rotPoint.x,
				yrot = rotPoint.y,
				rotation = this.rotation * 90,
				sx = this.initScale.sx,
				sy = this.initScale.sy,
				tmp_x = 0,
				tmp_y = 0;
				ssx = this.initBBox.x,
				ssy = this.initBBox.y,
			this.cells.animate(
				{transform: "t"+tmp_x+" "+tmp_y+"s"+sx+" "+sy+" "+ssx+" "+ssy+"r"+rotation+" "+xrot+" "+yrot},
				//{transform: "t"+tmp_x+" "+tmp_y+"s"+sx+" "+sy+" "+ssx+" "+ssy},
				500);
			//this.animate({"opacity": 1}, 500);
			this.setOpacity(1, 500);
		},

		/** END SELECT SHAPE AND RETURN TO PANEL **/

		/** ROTATION **/

		centerOfRotation: function (){
			var rdata = this.rotateMatrix(this.dataArr, this.rotation);
			var w = rdata.length * this.cellSize,
				h = rdata[0].length * this.cellSize;
			return {x: this.initBBox.x+w/2, y: this.initBBox.y+h/2};
		},

		rotateMatrix: function(data, rotation){
			rotation = Math.abs(rotation % 4);
			var rotatedData = _(data).clone();
			for (var numRotation  = 0; numRotation < rotation; numRotation++){
				var rotatedDataTmp = new Array();
				var numRows = rotatedData.length;
				var numCols = rotatedData[0].length;
				for (var colJ = numCols-1; colJ >= 0 ; colJ--) {
					var reverseCol = Array();
					for (var rowI = 0; rowI < numRows; rowI++){
						reverseCol.push(rotatedData[rowI][colJ]);
					}
					rotatedDataTmp.push(reverseCol);
				}
				rotatedData = _(rotatedDataTmp).clone();
			}
			return rotatedData;
		},

		rotate: function (rotation){
			if(this.isSelected){
				this.rotation += rotation;
				var rotPoint = this.centerOfRotation();
				this.cells.rotate(rotation*90, rotPoint.x, rotPoint.y);
			}
		}

		/** END ROTATION **/


	});


}(jQuery, _, Backbone, blokus));
