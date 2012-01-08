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
		canMove: false,
		rotation: 0,
		cells: undefined, //The set of cells or squares
		visibleCells: undefined, //The set of visible cells or squares
		invisibleCells: undefined, //The set of invisible cells or squares
		pos: {x:undefined, y:undefined}, // initial position of the shape
		cellsOnGameboard: undefined, // the cells which are on the gameboard
		dataArr: undefined, // The array of 0 or 1s which define the shape
		//Position of the shape in the gameboard
		posInGameboard: {x:undefined, y:undefined}, 
		destCor: {
			x: undefined,
			y: undefined
		},
		notInPanel: true,

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

		// current visible Boundary box
		visibleBBox: {
			sx: undefined,
			sy: undefined,
			width: undefined,
			height: undefined,
			ex: undefined,
			ey: undefined
		},

		// all of cells boundary box (not used)
		allBBox: {
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
			this.visibleCells = this.options.visibleCells;
			this.invisibleCells = this.options.invisibleCells;
			this.canMove = this.options.canMove;
			this.pos = this.options.pos;
			this.dataArr = this.options.dataArr;
			//this.destCor = this.options.destCor;
			this.prevDist = this.options.prevDist;
			this.mousePage = this.options.mousePage;
			this.gameboardBBox = this.options.gameboardBBox;
			this.gameBBox = this.options.gameBBox;
			this.gameboardCellSize = this.options.gameboardCellSize;
			this.cellSize = this.options.cellSize;
			this.setInitBBoxes();
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

		// Returns an array which has the coordinats of the visible cells on board
		getCorOnBoard: function (){
			var corOnBoard = [];
			this.cellsOnGameboard.forEach(function (cell) { corOnBoard.push(cell.posOnBoard)});
			return corOnBoard;
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

		//Should be called after calDistTravel
		moveShape: function (){
			var time = 0;
			var rotPoint = this.getCenterRotation();
			var rotation = this.rotation * 90;
			if(this.cells.getBBox(true).x > 132 && !this.fullScale){
				this.curScale = {sx: 1, sy: 1};
				this.fullScale = true;
				time = 75;
			}
			else if(this.cells.getBBox(true).x < 132 && this.fullScale){
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
			this.cells.toFront();
		},

		/** END MOVEMENT **/

		getCellsOnGameboard: function (gameboard, newSet) {
			if(this.isShapeInGameboard()){
				this.posInGameboard = {
					x: Math.round((this.visibleBBox.sx - this.gameboardBBox.sx)/ this.gameboardCellSize),
					y: Math.round((this.visibleBBox.sy - this.gameboardBBox.sy)/ this.gameboardCellSize),
				};
				if(this.posInGameboard.x > 5)
					this.posInGameboard.x = Math.ceil((this.visibleBBox.sx - this.gameboardBBox.sx)/ this.gameboardCellSize);
				if(this.posInGameboard.y > 5)
					this.posInGameboard.y = Math.ceil((this.visibleBBox.sy - this.gameboardBBox.sy)/ this.gameboardCellSize);
				var rdata = this.rotateMatrix(this.dataArr, this.rotation);
				var numRows = rdata.length;
				var numCols = rdata[0].length;
				for (var rowI = 0; rowI < numRows; rowI++){
					for (var colJ = 0; colJ < numCols; colJ++) {
						if (rdata[rowI][colJ] == 1) {
							newSet.push(gameboard.grid[this.posInGameboard.x+colJ][this.posInGameboard.y+rowI]);
							gameboard.grid[this.posInGameboard.x+colJ][this.posInGameboard.y+rowI].posOnBoard = {
								x:this.posInGameboard.x+colJ,
								y:this.posInGameboard.y+rowI
							};
							// TODO for validation, make the "r" something variable for different players
							//shapeSet.board_piece_set.push({x:cellIndex.x+colJ, y:cellIndex.y+rowI});
						}
					}
				}
				var cell = gameboard.grid[this.posInGameboard.x][this.posInGameboard.y];
				if(this.rotation%2 == 0){
					this.destCor = {
						x: cell.attr("x") - this.initBBox.x,
						y: cell.attr("y") - this.initBBox.y
					};
				}
				else{
					this.destCor = {
						x: cell.attr("x") - this.initRBBox.x,
						y: cell.attr("y") - this.initRBBox.y
					};
				}
				this.cellsOnGameboard = newSet;
				this.notInPanel = false;
				return this.cellsOnGameboard;
			}
			else{
				this.notInPanel = true;
				this.posInGameboard = {x:undefined, y:undefined};
				this.cellsOnGameboard = undefined;
				return undefined;
			}
		},

		/** VALIDATION AND BOUNDARY BOXS **/

		isShapeInGameboard: function () {
			this.calVisibleBBox();
			if (this.visibleBBox.sx >= this.gameboardBBox.sx &&
				this.visibleBBox.sy >= this.gameboardBBox.sy &&
				this.visibleBBox.ex - this.gameboardCellSize < this.gameboardBBox.ex &&
				this.visibleBBox.ey - this.gameboardCellSize < this.gameboardBBox.ey) {
				return true;
			}
			else{
				return false;
			}
		},

		isShapeInGame: function () {
			this.calVisibleBBox();
			if (this.visibleBBox.sx > 0 && this.visibleBBox.sy > 0 &&
				this.visibleBBox.ex < this.gameBBox.width &&
				this.visibleBBox.ey < this.gameBBox.height){
				return true;
			}
			else{
				return false;
			}
		},

		setInitBBoxes: function (){
			if (this.options.initBBox == undefined){
				this.initBBox = {
					x:this.pos.x,
					y:this.pos.y,
					width: this.cells.getBBox().width,
					height: this.cells.getBBox().height,
				};
				var rotPoint = this.getCenterRotation();
				this.cells.transform("r90 "+rotPoint.x+" "+rotPoint.y);
				this.initRBBox = {
					x:this.cells.getBBox().x,
					y:this.cells.getBBox().y,
					width: this.cells.getBBox().width,
					height: this.cells.getBBox().height,
				};
				this.cells.transform("");
				this.options.initBBox = this.initBBox; // prevent from rerun
			}
		},

		calAllBBox: function (){
			this.allBBox = {
				sx: this.cells.getBBox().x,
				sy: this.cells.getBBox().y,
				width: this.cells.getBBox().width,
				height: this.cells.getBBox().height,
				ex: this.cells.getBBox().x + this.cells.getBBox().width, //- this.gameboardCellSize,
				ey: this.cells.getBBox().y + this.cells.getBBox().height //- this.gameboardCellSize,
			};
		},

		calVisibleBBox: function() {
			this.visibleBBox = this.calBBox(this.visibleCells);
		},

		calBBox: function(cells) {
			return {
				sx: cells.getBBox().x,
				sy: cells.getBBox().y,
				width: cells.getBBox().width,
				height: cells.getBBox().height,
				ex: cells.getBBox().x + cells.getBBox().width, //- this.gameboardCellSize,
				ey: cells.getBBox().y + cells.getBBox().height //- this.gameboardCellSize,
			};

		},

		inBoardValidation: function(gameboard, newSet){
			if(this.isShapeInGameboard()){
				if (this.cellsOnGameboard != undefined)
					this.cellsOnGameboard.forEach(function (c) {c.attr({"fill": "#GGG"})});
				this.getCellsOnGameboard(gameboard, newSet);

				//Validation
				var corner = false;
				var conflict = false;
				this.cellsOnGameboard.forEach(function (c) {
					if (blokus.utils.is_corner(c.posOnBoard.x, c.posOnBoard.y)){
						corner = true; //Test to see if piece uses a corner square
					}
					if (blokus.utils.in_conflict(c.posOnBoard.x, c.posOnBoard.y)){
						conflict = true; //Check for conflicting piece
					}
				});
				
				var corOnBoard = this.getCorOnBoard();
				var validPosition = blokus.utils.valid(corOnBoard);
				var colour = validPosition ? "#0C3" : "#F0A";
				this.notInPanel = validPosition ? false : true;
				this.cellsOnGameboard.forEach(function (c) {c.attr({"fill": colour});});
			} 
			else {
				this.notInPanel = true;
				if (this.cellsOnGameboard != undefined)
					this.cellsOnGameboard.forEach(function (c) {c.attr({"fill": "#GGG"})});
			}
		},

		/** END VALIDATION AND BOUNDARY BOXS **/

		/** SELECT SHAPE AND RETURN TO PANEL **/

		selectShape: function (e){
			if (this.canMove){
				this.isSelected = true;
				this.prevDistX = 0;
				this.prevDistY = 0;
				this.mousePageX = e.pageX - e.offsetX + this.initBBox.x;
				this.mousePageY = e.pageY - e.offsetY + this.initBBox.y;
				this.setOpacity(0.5, 100);
			}
		},

		returnToPanel: function (){
			this.isSelected = false;
			var rotPoint = this.getCenterRotation();
			if (this.cellsOnGameboard != undefined)
				this.cellsOnGameboard.forEach(function (c) {c.attr({"fill": "#GGG"})});
			if(this.distMoved.x != 0 && this.distMoved.y != 0){
				var rotation = this.rotation * 90;
				this.animate(0, 0, this.initScale.sx, this.initScale.sy,
								this.initBBox.x, this.initBBox.y, rotation,
								rotPoint.x, rotPoint.y, 500);
			}
			this.setOpacity(1, 500);
		},

		goToPos: function (){
			this.isSelected = false;
			this.canMove = false;
			var rotPoint = this.getCenterRotation();
			var rotation = this.rotation * 90;
			this.animate(this.destCor.x, this.destCor.y, this.curScale.sx, this.curScale.sy,
						 this.initBBox.x, this.initBBox.y, rotation,
						 rotPoint.x, rotPoint.y, 500);
			this.setOpacity(1, 500);
		},

		/** END SELECT SHAPE AND RETURN TO PANEL **/

		/** ROTATION **/

		getCenterRotation: function (){
			var data =this.dataArr;
			var h = data.length * this.cellSize,
				w = data[0].length * this.cellSize;
			return {x: this.initBBox.x+w/2, y: this.initBBox.y+h/2};
		},

		rotateMatrix: function(data, rotation){
			// This if fixes a very weird bug
			if (rotation > 0)
				if((rotation+2) %2 != 0)
					rotation = rotation + 2;
			rotation = Math.abs(rotation % 4);
			var rotatedData = _(data).clone();
			for (var numRotation = 0; numRotation < rotation; numRotation++){
				var rotatedDataTmp = new Array(),
					numRows = rotatedData.length,
					numCols = rotatedData[0].length;
				for (var colJ = numCols-1; colJ >= 0 ; colJ--){
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

		rotate: function (rotation, gameboard, emptySet){
			if(this.isSelected){
				var this_ = this;
				this.rotation += rotation;
				var rotPoint = this.getCenterRotation();
				//this.cells.rotate(rotation*90, rotPoint.x, rotPoint.y);
				this.cells.animate({transform: "...r"+rotation*90+" "+rotPoint.x+" "+rotPoint.y}, 150);
				setTimeout(function(){this_.inBoardValidation(gameboard, emptySet);}, 151);
			}
		}

		/** END ROTATION **/


	});


}(jQuery, _, Backbone, blokus));