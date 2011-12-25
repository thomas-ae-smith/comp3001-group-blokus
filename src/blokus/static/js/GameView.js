(function ($, _, Backbone, blokus) {

	var colours = {
		red: '#ff0000',
		green: '#00ff00',
		blue: '#0000ff',
		yellow: '#ffff00'
	}

	//Helper function to visually rotate a piece
	function rotateMatrix(data, rotation){
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
	}

	//The GameView class handles rendering, block selection and placement.
	blokus.GameView = Backbone.View.extend({
		className: "gameboard",

		paper: undefined,

		gameBoard: undefined,
		playerPanels: undefined,

		width: 860,
		height: 620,

		stagingPos: { x:1, y:459, w:160, h:160 },
		imgStaticDir: "static/img/",

		drawRotationButton: function(x, y, img) {
			this.paper.rect(x, y, 30, 30, 10).attr({"fill":"gray"});
			this.paper.image(this.imgStaticDir + img, x + 6, y + 6, 18, 18);
		},
		drawStagingArea: function(pos) {
			this.paper.rect(pos.x, pos.y, pos.w, pos.h, 10).attr({"fill":"white", "stroke-width":2});
			this.drawRotationButton(pos.x + 3, pos.y + pos.h - 33, "rotateL.png");
			this.drawRotationButton(pos.x + pos.w - 33, pos.y + pos.h - 33, "rotateR.png");
		},

		render: function () {

			var this_ = this,
				loading = $('<div class="loading"></div>');

			// Reset element
			$(this.el).html("").append(loading);

			this.game = new blokus.Game({ id: this.options.id });

			// Get information about the game
			this.game.fetch({
				success: function () {
					loading.fadeOut(200, function () { loading.remove(); });

					// Make the Raphael element 800 x 600 in this view
					this_.paper = Raphael(this_.el, this_.width, this_.height);

					this_.gameBoard = (new blokus.GameBoard({ paper: this_.paper })).render();
					this_.playerPanels = [];

					// Player list with pieces
					this_.game.get("players").each(function (player, index) {
						var playerPanel = (new blokus.PlayerPanel({
							paper: this_.paper,
							player: player,
							index: index,
							gameView: this_
						})).render();

						this_.playerPanels.push(playerPanel);
					});

					//this_.drawStagingArea(this_.stagingPos);

					// FIXME: Temp just show that I can draw things
					//var data = window.data = blokus.pieceMasters.get(3).get("data");
					//window.shapeSet = drawPiece(50,23,data, this_);



					window.gb = this_;
				},
				error: function (model, response) {
					var msg = '';
					if (response.status === 404) {
						loading.fadeOut(200, function () { loading.remove(); });
						msg = "This game does not exist";
					} else {
						msg = response.responseText || "An error occured";
					}
					$(this_.el).html('<div class="error">' + msg + '</div>');
				}
			});

			return this;
		},

		//Draws a single piece
		drawPiece: function (x, y, data, colour, scaleX, scaleY) {
			var gameBoard = this.gameBoard,
				paper = this.paper;

			var cellSize = 25;
			var numRows = data.length;
			var numCols = data[0].length;
			var shapeSet = paper.set();
			shapeSet.dataArr = _(data).clone();
			for (var rowI = 0; rowI < numRows; rowI++){
				for (var colJ = 0; colJ < numCols; colJ++) {
					if (data[rowI][colJ] == 1) {
						var cell = paper.rect(x+(colJ)*cellSize, y+(rowI)*cellSize,
												cellSize, cellSize);
						cell.attr({fill: colours[colour]});
						shapeSet.push(cell);
					}
				}
			}
			shapeSet.initBBox = {
				x:x,
				y:y,
				width: shapeSet.getBBox().width,
				height: shapeSet.getBBox().height,
			};
			shapeSet.curScale = {sx: scaleX, sy:scaleY, originalScale: false};
			shapeSet.scale(scaleX, scaleY, x, y);
			shapeSet.isSelected = false;
			shapeSet.rotation = 0;
			var highlighted_set = paper.set();
			$(window).mousemove(
				function(e){
					//on move
					if ( shapeSet.isSelected ){
						var SBBox = {
							x : shapeSet.getBBox().x,
							y : shapeSet.getBBox().y,
							width : shapeSet.getBBox().width,
							height : shapeSet.getBBox().height,
						};

						var canvas = $(paper.canvas);
						var GSBox = {
							top: canvas.offset().top,
							left: canvas.offset().left,
							right: canvas.offset().left + canvas.width(),
							bottom: canvas.offset().top + canvas.height(),
							width: canvas.width(),
							height: canvas.height(),
						};

						var tmpR = Math.abs(shapeSet.rotation % 4);
						if (tmpR == 0){
							var distX = e.pageX - shapeSet.mousePageX;
							var distY = e.pageY - shapeSet.mousePageY;
						}
						else if (tmpR == 1){
							//dist the coordinates have been rotated by 90 degrees
							var distY = e.pageX - shapeSet.mousePageX;
							var distX = -(e.pageY - shapeSet.mousePageY);
						}
						else if (tmpR == 2){
							var distX = -(e.pageX - shapeSet.mousePageX);
							var distY = -(e.pageY - shapeSet.mousePageY);
						}
						else if (tmpR == 3){
							var distY = -(e.pageX - shapeSet.mousePageX);
							var distX = (e.pageY - shapeSet.mousePageY);
						}
						var futureSBBox = [
							SBBox.y + (e.pageY - shapeSet.mousePageY - shapeSet.prevDY), // top
							SBBox.x + SBBox.width + (e.pageX - shapeSet.mousePageX - shapeSet.prevDX), // right
							SBBox.y + SBBox.height + (e.pageY - shapeSet.mousePageY - shapeSet.prevDY), // bottom
							SBBox.x + (e.pageX - shapeSet.mousePageX - shapeSet.prevDX), // left
						];
						var boardBBox = [
							0, // top
							GSBox.width, // right
							GSBox.height, // bottom
							0, // left
						];
						var iT = 0; //tmpR%4;
						var iR = 1; //(tmpR%4+1 >= 4 ? (tmpR%4+1)%4 : tmpR%4+1);
						var iB = 2; //(tmpR%4+2 >= 4 ? (tmpR%4+2)%4 : tmpR%4+2);
						var iL = 3; //(tmpR%4+3 >= 4 ? (tmpR%4+3)%4 : tmpR%4+3);
						var iBT = 0;
						var iBR = 1;
						var iBB = 2;
						var iBL = 3;
						if (tmpR % 2 != 0){
							iT = 3;
							iR = 2;
							iB = 1;
							iL = 0;
							iBT = 0;
							iBR = 2;
							iBB = 1;
							iBL = 3;
						}

						var xMove = 0,
							yMove = 0;
						var sthChanged = false;
						if (futureSBBox[iL] > boardBBox[iBL] && futureSBBox[iR] <= boardBBox[iBR]) {
							xMove = distX - shapeSet.prevDistX;
						}
						if ( futureSBBox[iT] > boardBBox[iBT] && futureSBBox[iB] <= boardBBox[iBB]) {
							yMove = distY - shapeSet.prevDistY;
						}
						if (GSBox.top < e.pageY && GSBox.bottom > e.pageY &&
								GSBox.left < e.pageX && GSBox.right > e.pageX ){
							//shapeSet.translate((1/shapeSet.curScale.sx)*xMove, (1/shapeSet.curScale.sy)*yMove);
							var tmp_x = (1/shapeSet.curScale.sx)*distX;
							var tmp_y = (1/shapeSet.curScale.sy)*distY;
							//shapeSet.transform("t"+(1/shapeSet.curScale.sx)*distX+","+(1/shapeSet.curScale.sy)*distY);
							var sx = shapeSet.curScale.sx;
							var sy = shapeSet.curScale.sy;
							var ssx = shapeSet.initBBox.x;
							var ssy = shapeSet.initBBox.y;
							shapeSet.transform("t"+distX+" "+distY+"s"+sx+" "+sy+" "+ssx+" "+ssy)
							if(Math.abs(distX) + Math.abs(distY) > 100 && !shapeSet.curScale.originalScale){
								//shapeSet.animate({transform: "s"+"1"+" "+"1"+"t"+distX+" "+distY} , 0);
								shapeSet.curScale = {sx: 1, sy: 1, originalScale: true};
								shapeSet.transform("t"+distX+" "+distY+"s"+1+" "+1+" "+ssx+" "+ssy)
							}
							shapeSet.prevDistX = distX;
							shapeSet.prevDistY = distY;
							shapeSet.prevDX = e.pageX - shapeSet.mousePageX;
							shapeSet.prevDY = e.pageY - shapeSet.mousePageY;
						}
						// game board bounds
						var gbBounds = {
							sx: gameBoard.x,
							sy: gameBoard.y,
							ex: gameBoard.x + gameBoard.width,
							ey:gameBoard.y + gameBoard.height
						};
						// Check shapes to be in the gameScreen
						if (SBBox.x >= gbBounds.sx &&
							SBBox.y >= gbBounds.sy &&
							SBBox.x + SBBox.width - gameBoard.cellXSize < gbBounds.ex &&
							SBBox.y + SBBox.height - gameBoard.cellYSize < gbBounds.ey) {
							var cellIndex = {
								x: Math.floor((SBBox.x - gbBounds.sx)/ gameBoard.cellXSize),
								y: Math.floor((SBBox.y - gbBounds.sy)/ gameBoard.cellYSize),
							}

							if (highlighted_set.length != 0){
								highlighted_set.forEach(function (shape) {shape.attr({"fill": "#GGG"})});
								highlighted_set = paper.set();
							}
							tmpData = rotateMatrix(data, shapeSet.rotation);
							var numRows = tmpData.length;
							var numCols = tmpData[0].length;
							var corner = false;
							for (var rowI = 0; rowI < numRows; rowI++){
								for (var colJ = 0; colJ <= numCols; colJ++) {
									if (tmpData[rowI][colJ] == 1) {
										highlighted_set.push(gameBoard.arr[cellIndex.x+colJ][cellIndex.y+rowI]);

										//Test to see if piece uses a corner square
										if (blokus.utils.is_corner(cellIndex.x+colJ,cellIndex.y+rowI)){
											corner = true;
										}
									}
								}
							}
							var xrot = shapeSet.initBBox.x + shapeSet.initBBox.width/2;
							var yrot = shapeSet.initBBox.y + shapeSet.initBBox.height/2;
							var cell = gameBoard.arr[cellIndex.x][cellIndex.y];

							//Highlight green if valid position else white
							highlighted_set.forEach(function (shape) {
								if (corner){
									shape.attr({"fill": "#00CC33"});
								}else{
									shape.attr({"fill": "#EEE"});
								}
							});

							shapeSet.destCor = {
								x: cell.attr("x") - shapeSet.initBBox.x,
								y:cell.attr("y") - shapeSet.initBBox.y
							 };
						}
						else {
							shapeSet.destCor = { x: shapeSet.initBBox.x, y: shapeSet.initBBox.y };
							shapeSet.curScale = {sx: scaleX, sy:scaleY, originalScale: false};
							if (highlighted_set.length != 0){
								highlighted_set.forEach(function (shape) {shape.attr({"fill": "#GGG"})});
								highlighted_set = paper.set();
							}
						}
					}
				}
			);
			shapeSet.click(
				function (e, x, y){
					// on Start
					if(!shapeSet.isSelected){
						shapeSet.isSelected = true;
						shapeSet.prevDistX = 0;
						shapeSet.prevDistY = 0;
						shapeSet.mousePageX = e.pageX;
						shapeSet.mousePageY = e.pageY;
						shapeSet.animate({"opacity": 0.5}, 0);
					}
					else {
						shapeSet.isSelected = false;
						var xrot = shapeSet.initBBox.x + shapeSet.initBBox.width/2;
						var yrot = shapeSet.initBBox.y + shapeSet.initBBox.height/2;
						var rotation = shapeSet.rotation * 90;
						var tmp_x = shapeSet.destCor.x;
						var tmp_y = shapeSet.destCor.y;
						var sy = 1;
						var sx = 1;
						var ssx = shapeSet.initBBox.x;
						var ssy = shapeSet.initBBox.y;
						if (tmp_x == shapeSet.initBBox.x && tmp_y == shapeSet.initBBox.y){
							sx = shapeSet.curScale.sx;
							sy = shapeSet.curScale.sy;
							ssx = tmp_x;
							ssy = tmp_y;
							tmp_x = 0;
							tmp_y = 0;
						}
						window.cur = shapeSet;
						shapeSet.animate(
							//{transform: "t"+tmp_x+" "+tmp_y+"r"+rotation+" "+xrot+" "+yrot+"s"+sx+" "+sy+" "+ssx+" "+ssy},
							{transform: "t"+tmp_x+" "+tmp_y+"s"+sx+" "+sy+" "+ssx+" "+ssy},
							500);
						shapeSet.animate({"opacity": 1}, 500);
						//shapeSet.animate({transform:"r180,75,73"}, 500) //around the center of the shape set
					}
				}
			);
			blokus.mapKeyDown(37,
				function () {
					var xrot = shapeSet.initBBox.x + shapeSet.initBBox.width/2;
					var yrot = shapeSet.initBBox.y + shapeSet.initBBox.height/2;
					shapeSet.rotate(90, xrot, yrot);
					shapeSet.rotation += 1;
				}
			);
			blokus.mapKeyDown(39,
				function () {
					var xrot = shapeSet.initBBox.x + shapeSet.initBBox.width/2;
					var yrot = shapeSet.initBBox.y + shapeSet.initBBox.height/2;
					shapeSet.rotate(-90, xrot, yrot);
					shapeSet.rotation -= 1;
				}
			);
			return shapeSet;
		}
	});

	blokus.GameBoard = Backbone.View.extend({
		cellXSize: undefined,
		cellYSize: undefined,
		numXCells: 20,
		xBorder: 2,
		numYCells: 20,
		yBorder: 2,
		boardPos: { x:180, y:75, w:500, h:500 },

		x: undefined,
		y: undefined,
		width: undefined,
		height: undefined,

		arr: undefined,

		render: function () {
			//Init the values of the board;
			var x = this.x = this.boardPos.x;
			var y = this.y = this.boardPos.y;
			var width = this.width = this.boardPos.w;
			var height = this.height = this.boardPos.h;

			// Gameboard
			var numXCells = this.numXCells;
			var numYCells = this.numYCells;

			var cellXSize = width/numXCells; //Size of cell on X axis
			var cellYSize = height/numYCells; //Size of cell on Y axis

			this.cellXSize = cellXSize;
			this.cellYSize = cellYSize;

			this.arr = new Array(numXCells);

			for (var i=x, iBoard=0; i<width+x ; i+=cellXSize, iBoard++) {
				this.arr[iBoard] = new Array(numYCells);
				for (var j = y, jBoard=0; j<height+y ; j+=cellYSize, jBoard++) {
					var cell = this.options.paper.rect(i, j, cellXSize - this.xBorder, cellYSize - this.yBorder);
					cell.attr("fill", "#GGG");
					this.arr[iBoard][jBoard] = cell;
				}
			}
			return this;
		}
	});

	// Each player has a panel with a tray of piece
	blokus.PlayerPanel = Backbone.View.extend({
		playerPositions: [
			{ x:1, y:19, w:160, h:440 },
			{ x:699, y:19, w:160, h:200 },
			{ x:699, y:219, w:160, h:200 },
			{ x:699, y:419, w:160, h:200 }
		],

		render: function () {
			//TODO: add piece list for each player, and add it into drawPlayer()
			var this_ = this,
				gameView = this.options.gameView,
				game = gameView.game,
				pieces = game.get("pieces"),
				player = this.options.player,
				user = new blokus.User({ id: player.get("userId") }),
				pos = this.playerPositions[this.options.index],
				paper = this.options.paper;

			//Draws the player box to contain the pieces
			paper.rect(pos.x, pos.y, pos.w, pos.h, 10).attr({"fill":"gray", "stroke-width":2});
			paper.rect(pos.x + 3, pos.y + 30, pos.w - 6, pos.h - 33, 10).attr({"fill":"white", "stroke-width":2});

			user.fetch({
				success: function () {
					paper.text(pos.x + 10, pos.y + 20, user.get("name")).attr({
						"text-anchor": "start",
						"font-family": "Verdana",
						"font-weight": "bold",
						"font-size": 16
					});
				},
				error: function () {
					// TODO
				}
			});

			// FIXME: currently iterates through pieces and placed them. Should also scale and allow dragging and dropping more successfully
			var x = pos.x + 30;

			_(player.get("colours")).each(function (colour) {
				var trayPieces = [];
				/*
				blokus.pieceMasters.each(function (pieceMaster){
					// Iterated through pieces that have not yet been placed and render to the player's piece tray
					trayPieces.push(_(pieces[colour].models).find(function (piece) {
							return pieceMaster.get("id") == piece.get("pieceMasterId");
					}));
				});
				*/
				trayPieces = blokus.pieceMasters.toJSON();
				var allPos = blokus.utils.get_points(trayPieces, pos.x + 10, pos.y + 35, pos.w - 27, pos.h - 20);
				for (var i = 0; i < allPos.length; i++){
					gameView.drawPiece(allPos[i].x, allPos[i].y, trayPieces[i].data, colour, 0.3, 0.3);
				}
			});
			/*
			_(player.get("colours")).each(function (colour) {
				var y = pos.y + 40;
				// Iterated through pieces that have not yet been placed and render to the player's piece tray
				blokus.pieceMasters.each(function (pieceMaster) {
					var piece = _(pieces[colour].models).find(function (piece) {
							return pieceMaster.get("id") == piece.get("pieceMasterId");
						});
						nx = x,
						ny = y;
					if (piece) {
						nx = gameView.gameBoard.x + piece.get("x") * gameView.gameBoard.cellXSize;
						ny = gameView.gameBoard.y + piece.get("y") * gameView.gameBoard.cellYSize;
					}
					gameView.drawPiece(nx, ny, pieceMaster.get("data"), colour);
					y += 100;
				});
				x += 50;
			});
			*/

			return this;
		}
	});
}(jQuery, _, Backbone, blokus));
