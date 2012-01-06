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
		},
		initScale: {
			sx: undefined,
			sy: undefined,
		},
		fullScale: false,

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

		// gameboard boundary box the grid
		gameboardBBox: {
			sx: undefined, // start x
			sy: undefined, // start y
			width: undefined, 
			height: undefined,
			ex: undefined, // end x
			ey: undefined  // end y
		},

		// game boundary box The whole game
		gameBBox: {
			sx: undefined,
			sy: undefined,
			width: undefined,
			height: undefined,
			ex: undefined,
			ey: undefined
		},

		gameboardCellSize: undefined,
		cellSize: undefined,

		// current Boundary box
		curBBox: {
			sx: undefined,
			sy: undefined,
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
			this.gameBBox = this.options.gameBBox;
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

		animate: function (x, y, sx, sy, ssx, ssy, rot, xrot, yrot, time){
			var tStr = "t"+x+" "+y+"s"+sx+" "+sy+" "+ssx+" "+ssy+"r"+rot+" "+xrot+" "+yrot;
			this.cells.animate(
				{transform: tStr},
				time
			);
		},

		transform: function (x, y, sx, sy, ssx, ssy, rot, xrot, yrot){
			var tStr = "t"+x+" "+y+"s"+sx+" "+sy+" "+ssx+" "+ssy+"r"+rot+" "+xrot+" "+yrot;
			this.cells.transform(tStr);
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
			if (this.curBBox.sx >= this.gameboardBBox.sx &&
				this.curBBox.sy >= this.gameboardBBox.sy &&
				this.curBBox.ex - this.gameboardCellSize < this.gameboardBBox.ex &&
				this.curBBox.ey - this.gameboardCellSize < this.gameboardBBox.ey) {
				return true;
			}
			else{
				return false;
			}
		},

		isShapeInGame: function () {
			this.calCurBBox();
			if (this.curBBox.sx > 0 && this.curBBox.sy > 0 &&
				this.curBBox.ex < this.gameBBox.width &&
				this.curBBox.ey < this.gameBBox.height){
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
				sx: this.cells.getBBox().x,
				sy: this.cells.getBBox().y,
				width: this.cells.getBBox().width,
				height: this.cells.getBBox().height,
				ex: this.cells.getBBox().x + this.cells.getBBox().width, //- this.gameboardCellSize,
				ey: this.cells.getBBox().y + this.cells.getBBox().height //- this.gameboardCellSize,
			};
		},

		moveShape: function (){
			var time = 0;
			var rotPoint = this.centerOfRotation();
			var rotation = this.rotation * 90;
			if(this.cells.getBBox().x > 132 && !this.fullScale){
				this.curScale = {sx: 1, sy: 1};
				this.fullScale = true;
				time = 75;
			}
			else if(this.cells.getBBox().x < 132 && this.fullScale){
				this.curScale = {sx: this.initScale.sx, sy: this.initScale.sy};
				this.fullScale = false;
				time = 75;
			}
			if (time == 0){
			this.transform( this.distMoved.x, this.distMoved.y, this.curScale.sx, this.curScale.sy,
							this.initBBox.x, this.initBBox.y, rotation,
							rotPoint.x, rotPoint.y);
			}
			else{
			this.animate(this.distMoved.x, this.distMoved.y, this.curScale.sx, this.curScale.sy,
						 this.initBBox.x, this.initBBox.y, rotation,
						 rotPoint.x, rotPoint.y, time);
			}
			if(this.isShapeInGame()){
				this.prevDistX = this.distMoved.x;
				this.prevDistY = this.distMoved.y;
			}
			else{
				this.transform( this.prevDistX, this.prevDistY, this.curScale.sx, this.curScale.sy,
							  this.initBBox.x, this.initBBox.y, rotation,
							  rotPoint.x, rotPoint.y);
			}
		},

		/** END VALIDATION AND BOUNDARY BOXS **/

		/** SELECT SHAPE AND RETURN TO PANEL **/

		selectShape: function (e){
			this.isSelected = true;
			this.prevDistX = 0;
			this.prevDistY = 0;
			this.mousePageX = e.pageX - e.offsetX + this.initBBox.x;
			this.mousePageY = e.pageY - e.offsetY + this.initBBox.y;
			this.setOpacity(0.5, 100);
		},

		returnToPanel: function (){
			this.isSelected = false;
			var rotPoint = this.centerOfRotation();
			var rotation = this.rotation * 90;
			this.animate(0, 0, this.initScale.sx, this.initScale.sy,
							this.initBBox.x, this.initBBox.y, rotation,
							rotPoint.x, rotPoint.y, 500)
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
