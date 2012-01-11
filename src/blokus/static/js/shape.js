(function ($, _, Backbone, blokus) {
	"use strict";

	var colours = {
		/*
		red: '#ff0000',
		green: '#00ff00',
		blue: '#0000ff',
		yellow: '#ffff00'
		*/
		red: '/static/img/blockred.png',
		green: '/static/img/blockgreen.png',
		blue: '/static/img/blockblue.png',
		yellow: '/static/img/blockyellow.png'
	}

	blokus.Shape = Backbone.View.extend({

		/*
		 *  Variables passed in initialize
		 *  */
		gameboard: undefined,
		paper: undefined,
		colour: undefined,
		pieceMaster: undefined,

		inPanel: true,

		// initial Boundary box
		initBBox: {
				x:undefined,
				y:undefined,
				width: undefined,
				height: undefined
		},

		curScale: {
			x: 1,
			y: 1,
		},
		initScale: {
			x: 0.3,
			y: 0.3,
		},
		fullScale: false,
		haloCircle: undefined,
		haloImgs: undefined,
		haloBCircle: undefined,
		haloOn: true,
		isSelected: false,
		canMove: false,
		rotation: 0,
		flipNum: 0,
		flipHorz: false,
		flipVert: false,
		cells: undefined, //The set of cells or squares
		visibleCells: undefined, //The set of visible cells or squares
		invisibleCells: undefined, //The set of invisible cells or squares
		pos: {x:0, y:0}, // initial position of the shape
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

		gameboardCellSize: 23,
		cellSize: 22,

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
			var this_ = this;
			this.gameboard = this.options.gameboard;
			this.paper = this.options.paper;
			this.colour = colours[this.options.colour];
			this.pieceMaster = this.options.pieceMaster;

			// initialization
			this.cells = this.paper.set();
			this.visibleCells = this.paper.set();
			this.invisibleCells = this.paper.set();
			this.renderShape(); // Creates the cells
			this.setBBoxs(); //Set initial and gameboard Boundary box
			this.initScale = _(this.curScale).clone();
			this.addMouseListeners()

			//this.canMove = this.options.canMove;
			//this.dataArr = this.options.dataArr;
			//this.destCor = this.options.destCor;
			this.prevDist = this.options.prevDist;
			this.mousePage = this.options.mousePage;
			//this.gameboardBBox = this.options.gameboardBBox;
			//this.gameboardCellSize = this.options.gameboardCellSize;
			this.gameboard = this.options.gameboard;
			// Apply the current scale given
			var cenPoint = this.getCenterOfShape();
			if (this.curScale != undefined){
				this.cells.scale(this.curScale.x, this.curScale.y,
							cenPoint.x, cenPoint.y);
			}
			this.haloImgs = this.paper.set();
			this.haloImgs.push(this.paper.image('/static/img/rotateL.png', 0, 0, 18, 18));
			this.haloImgs.push(this.paper.image('/static/img/rotateR.png', 0, 0, 18, 18));
			this.haloImgs.push(this.paper.image('/static/img/flipV.png', 0, 0, 18, 18));
			this.haloImgs.push(this.paper.image('/static/img/flipH.png', 0, 0, 18, 18));
			this.haloImgs.attr("opacity", 0);
		},

		render: function(){
			return this;
		},

		/* GLOBAL METHODS */
		moveToPanel: function(panel){
			var boundaries = panel.getBoundaries();

			this.rotation = 0;
			this.changeFlipToScale(0);

			this.isSelected = false;
			this.canMove = panel.isActive();// TODO FIX IT IS BROCKEN //&& panel.options.player.get("user_id") == blokus.user.get("id");
			this.inPanel = true;

			var cenPoint = this.getCenterOfShape();
			var rotation = this.rotation * 90;

			var scale = panel.isActive() ? 0.7 : 0.4;
			this.curScale.x = scale;
			this.curScale.y = scale;
			this.initScale.x = scale;
			this.initScale.y = scale;

			this.pos = panel.shapePositions[Number(this.pieceMaster.get("id"))];
			console.log(this.pos.y)

			this.transform(this.pos.x, this.pos.y, this.curScale.x, this.curScale.y,
						 cenPoint.x, cenPoint.y, rotation,
						 cenPoint.x, cenPoint.y);
			this.setVisibleCellsOpacity(1, 500);
		},
		moveToGameboard: function(x, y, flip, rotation){
			this.posInGameboard = {x:x, y:y};
			this.rotation = rotation;
			this.changeFlipToScale(flip);
			this.getDestCor();
			this.isSelected = false;
			this.canMove = false;
			this.inPanel = false;
			this.curScale.x = 1;
			this.curScale.y = 1;
			var cenPoint = this.getCenterOfShape();
			var rotation = this.rotation * 90;
			this.animate(this.destCor.x, this.destCor.y, this.curScale.x, this.curScale.y,
						 cenPoint.x, cenPoint.y, rotation,
						 cenPoint.x, cenPoint.y, 500);
			this.setVisibleCellsOpacity(1, 500);
		},

		isInPanel: function(){
			return this.inPanel;
		},
		/* END GLOBAL METHODS */

		renderShape: function(){
			var data = this.pieceMaster.get("piece_data"),
				numRows = data.length,
				numCols = data[0].length;
			this.cells.dataArr = _(data).clone();
			this.dataArr = _(data).clone();
			for (var rowI = 0; rowI < numRows; rowI++){
				for (var colJ = 0; colJ < numCols; colJ++) {
					if (data[rowI][colJ] == 1) {
						//var cell = paper.rect((colJ)*cellSize, (rowI)*cellSize,
												//cellSize, cellSize);
						//cell.attr({fill: this.colour});
						var cell = this.paper.image(this.colour, (colJ)*this.cellSize, (rowI)*this.cellSize,
												this.cellSize, this.cellSize);
						cell.attr({opacity: 0});
						cell.opacity = 0;
						this.cells.push(cell);
						this.visibleCells.push(cell);
					}
					else{
						//var cell = this.paper.rect((colJ)*this.cellSize, (rowI)*this.cellSize,
												//this.cellSize, this.cellSize);
						//cell.attr({fill: this.colour, opacity: 0});
						var cell = this.paper.image(this.colour, (colJ)*this.cellSize, (rowI)*this.cellSize,
												this.cellSize, this.cellSize);
						cell.attr({opacity: 0});
						cell.opacity = 0;
						this.cells.push(cell);
						this.invisibleCells.push(cell);
					}
				}
			}
		},

		setVisibleCellsOpacity: function(opacity, time){
			this.visibleCells.forEach(
				function (c) {
					c.animate({"opacity": opacity}, time);
					c.opacity = opacity;
				}
			);
		},

		setOpacity: function(opacity, time){
			this.cells.forEach(
				function (c) {
					if (c.opacity > 0){
						c.animate({"opacity": opacity}, time);
						c.opacity = opacity;
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
			var cenPoint = this.getCenterOfShape();
			var rotation = this.rotation * 90;
			if(this.cells.getBBox(true).x > 132 && !this.fullScale){
				this.curScale = {
					x: this.curScale.x > 0 ? 1 : -1,
					y: this.curScale.y > 0 ? 1 : -1
				};
				this.fullScale = true;
				time = 75;
			}
			else if(this.cells.getBBox(true).x < 132 && this.fullScale){
				this.curScale = {
					x: this.curScale.x > 0 ? this.initScale.x : -this.initScale.x,
					y: this.curScale.y > 0 ? this.initScale.y : -this.initScale.y
				};
				this.fullScale = false;
				time = 75;
			}
			if (time == 0){
				this.transform( this.distMoved.x, this.distMoved.y, this.curScale.x, this.curScale.y,
							//this.initBBox.x, this.initBBox.y, rotation,
							cenPoint.x, cenPoint.y, rotation,
							cenPoint.x, cenPoint.y);
			}
			else{
				this.animate(this.distMoved.x, this.distMoved.y, this.curScale.x, this.curScale.y,
						 cenPoint.x, cenPoint.y, rotation,
						 cenPoint.x, cenPoint.y, time);
			}
			if(this.isShapeInGame()){
				this.prevDistX = this.distMoved.x;
				this.prevDistY = this.distMoved.y;
			}
			else{
				this.transform( this.prevDistX, this.prevDistY, this.curScale.x, this.curScale.y,
							  cenPoint.x, cenPoint.y, rotation,
							  cenPoint.x, cenPoint.y);
			}
			//this.cells.toFront();
		},

		/** END MOVEMENT **/
		getDestCor: function(){
			var cell = this.gameboard.grid[this.posInGameboard.x][this.posInGameboard.y];
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
			return this.destCor;
		},

		getCellsOnGameboard: function () {
			if(this.posInGameboard.x > 5)
				this.posInGameboard.x = Math.ceil((this.visibleBBox.sx - this.gameboardBBox.sx)/ this.gameboardCellSize);
			if(this.posInGameboard.y > 5)
				this.posInGameboard.y = Math.ceil((this.visibleBBox.sy - this.gameboardBBox.sy)/ this.gameboardCellSize);
			var rotation = this.getRotation();
			var rdata = this.rotateMatrix(this.dataArr, rotation);
			var transData = this.flipMatrix(rdata, this.flipNum);
			var numRows = transData.length;
			var numCols = transData[0].length;
			var newSet = this.paper.set()
			for (var rowI = 0; rowI < numRows; rowI++){
				for (var colJ = 0; colJ < numCols; colJ++) {
					if (transData[rowI][colJ] == 1) {
						newSet.push(this.gameboard.grid[this.posInGameboard.x+colJ][this.posInGameboard.y+rowI]);
						this.gameboard.grid[this.posInGameboard.x+colJ][this.posInGameboard.y+rowI].posOnBoard = {
							x:this.posInGameboard.x+colJ,
							y:this.posInGameboard.y+rowI
						};
						// TODO for validation, make the "r" something variable for different players
						//shapeSet.board_piece_set.push({x:cellIndex.x+colJ, y:cellIndex.y+rowI});
					}
				}
			}
			var cell = this.gameboard.grid[this.posInGameboard.x][this.posInGameboard.y];
			this.getDestCor();
			this.cellsOnGameboard = newSet;
			this.notInPanel = false;
			return this.cellsOnGameboard;
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

		setBBoxs: function (){
			var canvas = $(this.paper.canvas);
			this.initBBox = {
				x:this.pos.x,
				y:this.pos.y,
				width: this.cells.getBBox().width,
				height: this.cells.getBBox().height,
			};
			var cenPoint = this.getCenterOfShape();
			this.cells.transform("r90 "+cenPoint.x+" "+cenPoint.y);
			this.initRBBox = {
				x:this.cells.getBBox().x,
				y:this.cells.getBBox().y,
				width: this.cells.getBBox().width,
				height: this.cells.getBBox().height,
			};
			this.cells.transform("");
			this.options.initBBox = this.initBBox; // prevent from rerun
			this.gameboardBBox = {
						sx: this.gameboard.offset.x, // start x
						sy: this.gameboard.offset.y, // start y
						width: this.gameboard.width,
						height: this.gameboard.height,
						ex: this.gameboard.offset.x + this.gameboard.width, // end x
						ey: this.gameboard.offset.y + this.gameboard.height  // end y
			};
			this.gameBBox = {
						sx: canvas.offset().top,
						sy: canvas.offset().left,
						width: Number(canvas.attr("width")), // does not work in firefox //canvas.width(),
						height: Number(canvas.attr("height")), // does not work in firefox //canvas.height(),
						ex: canvas.offset().left + Number(canvas.attr("width")), //canvas.width()
						ey: canvas.offset().top + Number(canvas.attr("height")) //canvas.height()
		  };
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

		inBoardValidation: function(){
			if (this.cellsOnGameboard != undefined)
				this.cellsOnGameboard.forEach(function (c) {c.attr({"fill": "#GGG"})});
			if(this.isShapeInGameboard()){
				this.posInGameboard = {
					x: Math.round((this.visibleBBox.sx - this.gameboardBBox.sx)/ this.gameboardCellSize),
					y: Math.round((this.visibleBBox.sy - this.gameboardBBox.sy)/ this.gameboardCellSize),
				};
				this.getCellsOnGameboard();

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
				var colour = validPosition ? "#FFFFFF" : "#666666";
				this.notInPanel = validPosition ? false : true;
				this.cellsOnGameboard.forEach(function (c) {c.attr({"fill": colour});});
			}
			else {
				this.notInPanel = true;
				this.notInPanel = true;
				this.posInGameboard = {x:undefined, y:undefined};
				this.cellsOnGameboard = undefined;
				if (this.cellsOnGameboard != undefined)
					this.cellsOnGameboard.forEach(function (c) {c.attr({"fill": "#GGG"})});
			}
		},

		/** END VALIDATION AND BOUNDARY BOXS **/

		/** SELECT SHAPE AND RETURN TO PANEL **/

		selectShape: function (e){
			if (this.canMove){
				window.s = this;
				this.isSelected = true;
				this.prevDistX = 0;
				this.prevDistY = 0;
				if(e.offsetX != undefined && e.offsetY != undefined){
					this.mousePageX = e.pageX - e.offsetX + this.initBBox.x;
					this.mousePageY = e.pageY - e.offsetY + this.initBBox.y;
				}
				else{
					this.mousePageX = e.pageX - e.layerX + this.initBBox.x;
					this.mousePageY = e.pageY - e.layerY + this.initBBox.y;
				}
				this.setVisibleCellsOpacity(0.5, 100);
			}
		},

		returnToPanel: function (){
			this.isSelected = false;
			this.fullScale = false;
			var cenPoint = this.getCenterOfShape();
			if (this.cellsOnGameboard != undefined)
				this.cellsOnGameboard.forEach(function (c) {c.attr({"fill": "#GGG"})});
			//if(this.distMoved.x != 0 && this.distMoved.y != 0){
				this.rotation = 0;
				this.curScale = _(this.initScale).clone();
				this.flipNum = 0;
				this.distMoved = { x: 0, y: 0 };
				this.animate(this.pos.x, this.pos.y, this.initScale.x, this.initScale.y,
								cenPoint.x, cenPoint.y, this.rotation*90,
								cenPoint.x, cenPoint.y, 500);
			//}
			this.setVisibleCellsOpacity(1, 500);
		},

		goToPos: function (){
			this.isSelected = false;
			this.canMove = false;
			var cenPoint = this.getCenterOfShape();
			var rotation = this.rotation * 90;
			this.animate(this.destCor.x, this.destCor.y, this.curScale.x, this.curScale.y,
						 cenPoint.x, cenPoint.y, rotation,
						 cenPoint.x, cenPoint.y, 500);
			this.setVisibleCellsOpacity(1, 500);
		},

		/** END SELECT SHAPE AND RETURN TO PANEL **/

		/** ROTATION **/

		getRotation: function (){
			var rotation = this.rotation;
			if (this.rotation > 0)
				if((this.rotation+2) %2 != 0)
					rotation = this.rotation + 2;
			return Math.abs(rotation % 4);
		},

		getCenterOfShape: function (){
			var data =this.dataArr;
			var h = data.length * this.cellSize,
				w = data[0].length * this.cellSize;
			return {x: this.initBBox.x+w/2, y: this.initBBox.y+h/2};
		},

		rotateMatrix: function(data, rotation){ // Rotation is between 0 and 3
			// This if fixes a very weird bug
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

		rotate: function (rotation){
			if(this.isSelected){
				var this_ = this;
				this.rotation += rotation;
				var cenPoint = this.getCenterOfShape();
				//this.cells.rotate(rotation*90, cenPoint.x, cenPoint.y);
				this.cells.animate({transform: "...r"+rotation*90+" "+cenPoint.x+" "+cenPoint.y}, 150);
				setTimeout(function(){this_.inBoardValidation();}, 151);
			}
		},

		/** END ROTATION **/

		/** FLIP **/

		flipMatrix: function(data, flip){
			var retData = new Array(),
				numRows = data.length,
				numCols = data[0].length;
			if (flip == 0) // Not fliped
				return _(data).clone();
			else if(flip == 1){ //Flipped horizantal
					for (var rowI = 0; rowI < numRows; rowI++){
						var revArr = _(data[rowI]).clone();
						retData.push(revArr.reverse());
					}
				return retData;
			}
			else if(flip == 2){ //Flipped vertical
				retData = data.reverse()
				return retData;
			}
			else{ //Both flipped
				for (var rowI = 0; rowI < numRows; rowI++){
					var revArr = _(data[rowI]).clone();
					retData.push(revArr.reverse());
				}
				return retData.reverse();
			}
		},

		changeFlipToScale: function(flipNum){
			/*
			if (flipNum == 0)
				this.curScale = this.fullScale ? {x:1, y:1} : {x:this.initScale.x, y:this.initScale.y};
			else if (flipNum == 1 && this.curScale.x > 0) // Set animation values
				this.curScale = this.fullScale ? {x:-1, y:1} : {x:-this.initScale.x, y:this.initScale.y};
			else if (flipNum == 1)
				this.curScale = this.fullScale ? {x:1, y:1} : {x:this.initScale.x, y:this.initScale.y};
			else if (flipNum == 2 && this.curScale.y > 0)
				this.curScale= this.fullScale ? {x:1, y:-1} : {x:this.initScale.x, y:-this.initScale.y};
			else if (flipNum == 2)
				this.curScale= this.fullScale ? {x:1, y:1} : {x:this.initScale.x, y:this.initScale.y};
			else if (flipNum == 3)
				this.curScale= this.fullScale ? {x:-1, y:-1} : {x:-this.initScale.x, y:-this.initScale.y};
			*/

			if (this.flipNum == 3) // Set the flipnum for server
				this.flipNum -= flipNum
			else if(this.flipNum == flipNum)
				this.flipNum = 0;
			else if(this.flipNum != 0)
				this.flipNum = 3;
			else
				this.flipNum = flipNum;

			if (this.flipNum == 0)
				this.curScale = this.fullScale ? {x:1, y:1} : {x:this.initScale.x, y:this.initScale.y};
			if (this.flipNum == 1)
				this.curScale = this.fullScale ? {x:-1, y:1} : {x:-this.initScale.x, y:this.initScale.y};
			if (this.flipNum == 2)
				this.curScale= this.fullScale ? {x:1, y:-1} : {x:this.initScale.x, y:-this.initScale.y};
			if (this.flipNum == 3)
				this.curScale= this.fullScale ? {x:-1, y:-1} : {x:-this.initScale.x, y:-this.initScale.y};
		},

		flip: function (flipNum){
			if(this.isSelected){
				var this_ = this;
				this.changeFlipToScale(flipNum);
				console.log(this.curScale.x, this.curScale.y);

				var cenPoint = this.getCenterOfShape();
				var x = this.distMoved.x != 0 ? this.distMoved.x : this.pos.x;
				var y = this.distMoved.y != 0 ? this.distMoved.y : this.pos.y;
				this.animate(x, y, this.curScale.x, this.curScale.y,
						 cenPoint.x, cenPoint.y, this.rotation*90,
						 cenPoint.x, cenPoint.y, 150);
				//this.cells.animate({transform: "...s"+this.curScale.x+" "+this.curScale.y+" "+cenPoint.x+" "+cenPoint.y}, 150);
				setTimeout(function(){this_.inBoardValidation();}, 151);
			}
		},

		/** END FLIP **/
		outOfShape: function(x, y){
			this.calAllBBox();
			if(x > this.allBBox.sx && y > this.allBBox.sy && x < this.allBBox.ex && y < this.allBBox.ey){
				return false;
			}
			return true;
		},

		halo: function(){
			if(this.haloCircle == undefined){
				var this_ = this,
					cenPoint = this.getCenterOfShape(),
					i = 0;
				cenPoint.x += this.pos.x;
				cenPoint.y += this.pos.y;
				var imgCorArr = [];
				imgCorArr.push(this.toCoords(cenPoint, 20, 45)); //rrImg
				imgCorArr.push(this.toCoords(cenPoint, 20, 135));//rlImg
				imgCorArr.push(this.toCoords(cenPoint, 20, 225));//brImg
				imgCorArr.push(this.toCoords(cenPoint, 20, 315));//blImg
				imgCorArr[0].x -= 2; imgCorArr[1].x -= 10; imgCorArr[2].x -= 10; imgCorArr[2].y -= 5; imgCorArr[3].y -= 5;
				//imgCorArr[1].y += 5;
				this.haloCircle = this.paper.set();
				this.haloBCircle = this.paper.circle(cenPoint.x, cenPoint.y, 35);
				this.haloBCircle.attr({fill:"#f00", opacity:0});
				window.c = this;
				this.haloImgs.forEach(function (img) {
					img.transform("t"+imgCorArr[i].x+" "+imgCorArr[i].y);
					i++;
				});
				this.haloCircle.push(this.paper.path(this.arc(cenPoint, 25, 0, 89)));
				this.haloCircle.push(this.paper.path(this.arc(cenPoint, 25, 91, 179)));
				this.haloCircle.push(this.paper.path(this.arc(cenPoint, 25, 181, 269)));
				this.haloCircle.push(this.paper.path(this.arc(cenPoint, 25, 271, 359)));
				var rotLeftFunc = function(){
					if(this_.haloOn){
						this_.isSelected = true;
						this_.rotate(1);
						this_.isSelected = false;
						console.log("Rotate Left");
					}
				};
				var rotRightFunc = function(){
					if(this_.haloOn){
						this_.isSelected = true;
						this_.rotate(-1);
						this_.isSelected = false;
						console.log("Rotate Right");
					}
				};
				var flipVFunc = function(){
					if(this_.haloOn){
						this_.isSelected = true;
						this_.flip(2);
						this_.isSelected = false;
						console.log("Flip Vertical");
					}
				};
				var flipHFunc = function(){
					if(this_.haloOn){
						this_.isSelected = true;
						this_.flip(1);
						this_.isSelected = false;
						console.log("Flip Horizantal");
					}
				}
				this.haloCircle[0].click(rotLeftFunc);
				this.haloImgs[0].click(rotLeftFunc);
				this.haloCircle[1].click(rotRightFunc);
				this.haloImgs[1].click(rotRightFunc);
				this.haloCircle[2].click(flipVFunc);
				this.haloImgs[2].click(flipVFunc);
				this.haloCircle[3].click(flipHFunc);
				this.haloImgs[3].click(flipHFunc);
				this.haloCircle.attr({stroke:"#ddd", "stroke-width": 14, opacity: 0});
				this.haloCircle.animate({opacity: 0.3}, 0);
				this.haloCircle.mouseover( function(){
						this_.haloOn = true;
				});
				this.haloImgs.scale(0.6, 0.6, 0, 0);
			}
			this.haloCircle.animate({opacity: 0.3}, 500);
			this.haloImgs.animate({opacity:1}, 500);
			this.haloOn = true;
			if(this.haloCircle != undefined && this.haloBCircle != undefined && this.haloImgs != undefined){
				this.haloCircle.toBack();
				this.haloBCircle.toBack();
				//this.haloImgs.toFront();
			}
			return this;
		},

		removeHalo: function(){
			var this_ = this;
			if (this.haloCircle != undefined && this.haloOn){
				this.haloCircle.animate({opacity: 0}, 500);
				this.haloImgs.animate({opacity: 0}, 500);
				this.haloBCircle.toBack();
				this.haloCircle.toBack();
				this.haloImgs.toBack();
				this.haloOn = false;
				setTimeout(function (){this_.haloCircle.toBack()}, 501);

			}
		},

		arc: function(center, radius, startAngle, endAngle) {
			var angle = startAngle;
			var coords = this.toCoords(center, radius, angle);
			var path = "M " + coords.x + " " + coords.y;
			while(angle<=endAngle) {
				coords = this.toCoords(center, radius, angle);
				path += " L " + coords.x + " " + coords.y;
				angle += 1;
			}
			return path;
		},

		toCoords: function(center, radius, angle){
			var radians = (angle/180) * Math.PI;
			var x = center.x + Math.cos(radians) * radius;
			var y = center.y + Math.sin(radians) * radius;
			return {x:x, y:y};
		},


		/* MOUSE LISTENER */
		addMouseListeners: function(){
			var this_ = this;
			$(window).mousemove(
				function(e){
					//on move
					if (this_.isSelected){
						this_.calVisibleBBox();

						this_.calDistTravel(e);
						this_.moveShape();
						this_.inBoardValidation();
					}
					else{
						if(blokus.haloArr.length != 0){
							var i = 0;
							_(blokus.haloArr).each(function (s){
								s.haloBCircle.toFront();
								if (s.haloBCircle != this_.paper.getElementByPoint(e.pageX, e.pageY)){
									s.removeHalo();
									if(!s.isSelected)
										s.returnToPanel();
									s.haloOn = false;
									blokus.haloArr[i] = undefined;
								}
								s.haloBCircle.toBack();
								i++;
							});
							blokus.haloArr.clean(undefined);
						}
					}
				}
			);
			this.cells.click(
				function (e, x, y){
					// on Start
					if(!this_.isSelected){
						this_.selectShape(e);
						var i = 0;
						_(blokus.haloArr).each(function (s){ // Remove All halos when a shape is selected
							s.removeHalo();
							s.haloOn = false;
							blokus.haloArr[i] = undefined;
							i++;
						});
						blokus.haloArr.clean(undefined);
					}
					else {
						if(this_.notInPanel){
							this_.returnToPanel();
						}
						else{
							var corOnBoard = this_.getCorOnBoard();
							var validPosition = blokus.utils.valid(corOnBoard);
							if(validPosition){
								this_.isSelected = false;
								//this_.getDestCor();
								this_.goToPos();
								// TODO CHANGE GAME VIEW TO THE CURRENT COLOUR
								_(corOnBoard).forEach(function (cor) {blokus.utils.add_cell_to_validation_grid(cor.x, cor.y, gameview.game.get("colour_turn"))});
								//this_.moveToGameboard(this_.destCor.x, this_.destCor.y, this_.flipNum, this_.rotation);
								this_.inPanel = false;
								this_.trigger("piece_placed", this_.posInGameboard.x, this_.posInGameboard.y, this.flipNum, this_.getRotation());
							}
						}
					}
				}
			);
			this.cells.mouseover(function () {
				if(!this_.isSelected && this_.canMove){
					var s = this_.halo();
					blokus.haloArr.push(s);
				}
			});
			blokus.mapKeyDown(37,
				function () {
					this_.rotate(-1);
				}
			);
			blokus.mapKeyDown(39,
				function () {
					this_.rotate(1);
				}
			);
			blokus.mapKeyDown(86, // v
				function (){
					this_.flip(2);
				}
			);
			blokus.mapKeyDown(72, // h
				function (){
					this_.flip(1);
				}
			);
		}
	});


}(jQuery, _, Backbone, blokus));
