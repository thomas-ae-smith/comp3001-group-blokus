(function ($, _, Backbone, blokus) {
	var cellSize = 22;

	var colours = {
		red: '#ff0000',
		green: '#00ff00',
		blue: '#0000ff',
		yellow: '#ffff00'
	}

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

	function centerOfRotation (data, rot, cellSize, x, y){
		var rdata = rotateMatrix(data, rot);
		var w = rdata.length * cellSize,
			h = rdata[0].length * cellSize;
		return {x: x+w/2, y: y+h/2};
	}

	blokus.GameView = Backbone.View.extend({
		className: "gameview",
		game: undefined,
		paper: undefined,

		render: function () {
			window.gameview = this;
			var this_ = this,
				el = this.el,
				$el = $(el),
				template = _.template($('#game-template').html());

			$el.html(template({ gameId: "HJKLO35" }));

			var paper = this.paper = Raphael(el, 800, 600),
				game = this.game = new blokus.Game({ id: this.options.id });
			

			game.fetch({ success: function () {
				// Make the Raphael element 800 x 600 in this view
				var gamej = game.toJSON(),
					playerPanels = [],
					positionId = 0,
					gameboard = this_.gameboard = new blokus.GameBoard({
						paper: paper,
						cellSize: cellSize,
						game: game,
						gameview: this_
					}).render();
					
				// Append to view
				$el.append(gameboard.el);



				// Create all the player panels
				_(game.players.models).each(function (player) {

					_(player.get("colours")).each(function (colour) {
						var options = { paper: paper, game: game, player: player, colour: colour, gameview: this_ },
							active = false,
							playerPanel = new blokus.PlayerPanel(options);
						
						 // Identify if this is the logged in user
						if (blokus.user.get("id") === player.get("userId")) {
							active = true;
							options.active = true;
							options.positionId = 0;
						} else {
							positionId++;
							options.positionId = positionId;
						}

						playerPanels.push(playerPanel);

						// Append to view
						$el.find(active ? ".playerpanelcontainer.left" : ".playerpanelcontainer.right").append(playerPanel.render().el);

						var unplacedPieces = new blokus.PieceCollection(),
							placedPieces = game.pieces[colour],
							placedPieceIds = placedPieces.pluck("pieceMasterId");

						// Determine what pieces have not been placed
						_(blokus.pieceMasters.models).each(function (pieceMaster) {
							var id = Number(pieceMaster.get("id"));

							if (placedPieceIds.indexOf(id) === -1) {
								unplacedPieces.add({ pieceMasterId: id });
							}
						});

						gameboard.renderPieces(colour, placedPieces);
						playerPanel.renderPieces(unplacedPieces);
						
					});
				});

				this_.$(".loading").remove();

			}, error: function () {
				// TODO
			}});
			return this;
		},

		//Draws a single piece
		drawPiece: function (x, y, data, colour, scaleX, scaleY) {
			var gameboard = this.gameboard,
				paper = this.paper;

			var numRows = data.length;
			var numCols = data[0].length;
			var cells = paper.set();
			cells.dataArr = _(data).clone();
			for (var rowI = 0; rowI < numRows; rowI++){
				for (var colJ = 0; colJ < numCols; colJ++) {
					if (data[rowI][colJ] == 1) {
						var cell = paper.rect(x+(colJ)*cellSize, y+(rowI)*cellSize,
												cellSize, cellSize);
						cell.attr({fill: colours[colour]});
						cell.opacity = 1;
						cells.push(cell);
					}
					else{
						var cell = paper.rect(x+(colJ)*cellSize, y+(rowI)*cellSize,
												cellSize, cellSize);
						cell.attr({fill: colours[colour], opacity: 0});
						cell.opacity = 0;
						cells.push(cell);
					}
				}
			}
			var canvas = $(paper.canvas);
			var shape = new blokus.shape(
				{
					dataArr: _(data).clone(), 
					cells: cells,
					pos: {x:x, y:y},
					curScale: {sx: scaleX, sy:scaleY, originalScale: false},
					cellSize: cellSize,
					gameboardCellSize: 23,
					gameBBox: {
								sx: canvas.offset().top,
								sy: canvas.offset().left,
								width: canvas.width(),
								height: canvas.height(),
								ex: canvas.offset().left + canvas.width(),
								ey: canvas.offset().top + canvas.height()
							  }
				}
			);

			var scaleFull = false;

			var highlighted_set = paper.set();
			// TODO Check if the pieces dont overide each other
			//shapeSet.board_piece_set = new Array();
			$(window).mousemove(
				function(e){
					//on move
					if (shape.isSelected){
						shape.calCurBBox();

						shape.calDistTravel(e);
						shape.moveShape();
						var distX = shape.distMoved.x;
						var distY = shape.distMoved.y;

						shape.cells.toFront();
						/*
						// game board bounds
						var gbBounds = {
							sx: gameboard.offset.x,
							sy: gameboard.offset.y,
							ex: gameboard.offset.x + gameboard.width,
							ey:gameboard.offset.y + gameboard.height
						};
						// Check shapes to be in the gameScreen
						if (SBBox.x >= gbBounds.sx &&
							SBBox.y >= gbBounds.sy &&
							SBBox.x + SBBox.width - gameboard.cellSize < gbBounds.ex &&
							SBBox.y + SBBox.height - gameboard.cellSize < gbBounds.ey) {
							var cellIndex = {
								x: Math.floor((SBBox.x - gbBounds.sx)/ gameboard.cellSize),
								y: Math.floor((SBBox.y - gbBounds.sy)/ gameboard.cellSize),
							}

							if (highlighted_set.length != 0){
								highlighted_set.forEach(function (shape) {shape.attr({"fill": "#GGG"})});
								highlighted_set = paper.set();
								shapeSet.board_piece_set = new Array();
							}
							tmpData = rotateMatrix(data, shapeSet.rotation);
							var numRows = tmpData.length;
							var numCols = tmpData[0].length;
							for (var rowI = 0; rowI < numRows; rowI++){
								for (var colJ = 0; colJ <= numCols; colJ++) {
									if (tmpData[rowI][colJ] == 1) {
										highlighted_set.push(gameboard.grid[cellIndex.x+colJ][cellIndex.y+rowI]);
										// TODO for validation, make the "r" something variable for different players
										shapeSet.board_piece_set.push({x:cellIndex.x+colJ, y:cellIndex.y+rowI});
									}
								}
							}
							var rotPoint = centerOfRotation(shapeSet.dataArr, shapeSet.rotation, cellSize, shapeSet.initBBox.x, shapeSet.initBBox.y);
							var xrot = rotPoint.x;
							var	yrot = rotPoint.y;
							var cell = gameboard.grid[cellIndex.x][cellIndex.y];

							
							//Validation
							var corner = false;
							var conflict = false;
							shapeSet.board_piece_set.forEach(function (shape) {
								//Test to see if piece uses a corner square
								if (blokus.utils.is_corner(shape.x, shape.y)){
									corner = true;
								}

								//Check for conflicting piece
								if (blokus.utils.in_conflict(shape.x, shape.y)){
									conflict = true;
								}
							});

							
							//Highlight red if invalid position, green if corner else white
							highlighted_set.forEach(function (shape) {
								if (corner){
									shape.attr({"fill": "#00CC33"});
								}else{
									shape.attr({"fill": "#EEE"});
								}

								if (conflict){
									shape.attr({"fill": "#FF00AA"});
								}
							});

							shapeSet.destCor = {
								x: cell.attr("x") - shapeSet.initBBox.x,
								y: cell.attr("y") - shapeSet.initBBox.y
							};

							//placePiece(colour, {
								//x: cellIndex.x,
								//y: cellIndex.y
							//})
							shapeSet.retToPanel = false;
						}
						else {
							shapeSet.destCor = { x: shapeSet.initBBox.x, y: shapeSet.initBBox.y };
							shapeSet.retToPanel = true;
							//shapeSet.curScale = {sx: scaleX, sy:scaleY, originalScale: false};
							shapeSet.initScale = {sx: scaleX, sy:scaleY, originalScale: false};
							if (highlighted_set.length != 0){
								highlighted_set.forEach(function (shape) {shape.attr({"fill": "#GGG"})});
								highlighted_set = paper.set();
								board_piece_set = new Array();
							}
						}
						*/
					}
				}
			);
			shape.cells.click(
				function (e, x, y){
					// on Start
					if(!shape.isSelected){
						shape.selectShape(e);
					}
					else {
						if(shape.returnToPanel){
							shape.returnToPanel();
						}
						else{
							var validPosition = blokus.utils.valid(shapeSet.board_piece_set);
							if(validPosition){
								shape.isSelected = false;
								var rotPoint = centerOfRotation(shapeSet.dataArr, shapeSet.rotation, cellSize, shapeSet.initBBox.x, shapeSet.initBBox.y);
								var xrot = rotPoint.x,
									yrot = rotPoint.y,
									rotation = shapeSet.rotation * 90,
									tmp_x = shapeSet.destCor.x,
									tmp_y = shapeSet.destCor.y,
									sy = 1,
									sx = 1,
									ssx = shapeSet.initBBox.x,
									ssy = shapeSet.initBBox.y;
								shapeSet.animate(
									{transform: "t"+tmp_x+" "+tmp_y+"s"+sx+" "+sy+" "+ssx+" "+ssy+"r"+rotation+" "+xrot+" "+yrot},
									//{transform: "t"+tmp_x+" "+tmp_y+"s"+sx+" "+sy+" "+ssx+" "+ssy},
									500);
								//shapeSet.animate({"opacity": 1}, 500);
								shapeSet.forEach(
									function (c) {
										if (c.opacity > 0){
											c.animate({"opacity": 1}, 500);
										}
									}
								);

								shapeSet.board_piece_set.forEach(function (cor) {blokus.board.get("gridPlaced")[cor.x][cor.y] = gameview.game.get("colourTurn")[0]});
								//shapeSet.animate({transform:"r180,75,73"}, 500) //around the center of the shape set
								window.cur = shapeSet;
								console.log("t"+tmp_x+" "+tmp_y+"s"+sx+" "+sy+" "+ssx+" "+ssy+"r"+rotation+" "+xrot+" "+yrot);
							}
						}
					}
				}
			);
			blokus.mapKeyDown(37,
				function () {
					shape.rotate(1);
				}
			);
			blokus.mapKeyDown(39,
				function () {
					shape.rotate(-1);
				}
			);
			return shape.cells;
		}

	});
}(jQuery, _, Backbone, blokus));
