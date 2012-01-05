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
			var tmpXRot = shapeSet.initBBox.x + shapeSet.initBBox.width/2;
			var tmpYRot = shapeSet.initBBox.y + shapeSet.initBBox.height/2;
			shapeSet.rotate(90, tmpXRot, tmpYRot);
			// The initial coordinates of roteted ones
			shapeSet.rotatedBBox = {
				x:shapeSet.getBBox().x,
				y:shapeSet.getBBox().y,
				width: shapeSet.getBBox().width,
				height: shapeSet.getBBox().height,
			};
			shapeSet.rotate(-90, tmpXRot, tmpYRot);
			shapeSet.curScale = {sx: scaleX, sy:scaleY, originalScale: false};
			var scaleFull = false;
			shapeSet.scale(scaleX, scaleY, x, y);
			shapeSet.isSelected = false;
			shapeSet.rotation = 0;
			var highlighted_set = paper.set();
			// TODO Check if the pieces dont overide each other
			shapeSet.board_piece_set = new Array();
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

						var tmpR = Math.abs(shapeSet.rotation % 2);
						var distX = e.pageX - shapeSet.mousePageX,
							distY = e.pageY - shapeSet.mousePageY;
						if (tmpR == 0){
							distX -= shapeSet.getBBox().width/2;
							distY -= shapeSet.getBBox().height/2;
						}
						else{
							distX -= shapeSet.getBBox().height/2;
							distY -= shapeSet.getBBox().width/2;
						}
						shapeSet.toFront();
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
							var xrot = shapeSet.initBBox.x + shapeSet.initBBox.width/2;
							var yrot = shapeSet.initBBox.y + shapeSet.initBBox.height/2;
							var rotation = shapeSet.rotation * 90;

							shapeSet.rotatedBBox = {
								x:shapeSet.getBBox().x,
								y:shapeSet.getBBox().y,
								width: shapeSet.getBBox().width,
								height: shapeSet.getBBox().height,
							};
							if(Math.abs(distX) + Math.abs(distY) > 100 && !scaleFull){
								//shapeSet.animate({transform: "s"+"1"+" "+"1"+"t"+distX+" "+distY} , 0);
								shapeSet.curScale = {sx: 1, sy: 1, originalScale: true};
								scaleFull = true;
								//shapeSet.transform("t"+distX+" "+distY+"s"+1+" "+1+" "+ssx+" "+ssy+"r"+rotation+" "+xrot+" "+yrot)
								shapeSet.animate(
									{transform:"t"+distX+" "+distY+"s"+1+" "+1+" "+ssx+" "+ssy+"r"+rotation+" "+xrot+" "+yrot},
									75
								);
							}
							else if(Math.abs(distX) + Math.abs(distY) < 100 && scaleFull){
								shapeSet.curScale = {sx: scaleX, sy: scaleY, originalScale: false};
								scaleFull = false;
								shapeSet.animate(
									{transform:"t"+distX+" "+distY+"s"+sx+" "+sy+" "+ssx+" "+ssy+"r"+rotation+" "+xrot+" "+yrot},
									75
								);
							}
							else{
								shapeSet.transform("t"+distX+" "+distY+"s"+sx+" "+sy+" "+ssx+" "+ssy+"r"+rotation+" "+xrot+" "+yrot)
							}
							if(shapeSet.getBBox().x > 0 && shapeSet.getBBox().y > 0 &&
								shapeSet.getBBox().x + shapeSet.getBBox().width < GSBox.width &&
								shapeSet.getBBox().y + shapeSet.getBBox().height < GSBox.height){
								shapeSet.prevDistX = distX;
								shapeSet.prevDistY = distY;
								shapeSet.prevDX = e.pageX - shapeSet.mousePageX;
								shapeSet.prevDY = e.pageY - shapeSet.mousePageY;
							}
							else{
								shapeSet.transform("t"+shapeSet.prevDistX+" "+shapeSet.prevDistY+"s"+sx+" "+sy+" "+ssx+" "+ssy+"r"+rotation+" "+xrot+" "+yrot)
							}
						}
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
							var xrot = shapeSet.initBBox.x + shapeSet.initBBox.width/2;
							var yrot = shapeSet.initBBox.y + shapeSet.initBBox.height/2;
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

							/*placePiece(colour, {
								x: cellIndex.x,
								y: cellIndex.y
							})*/
						}
						else {
							shapeSet.destCor = { x: shapeSet.initBBox.x, y: shapeSet.initBBox.y };
							//shapeSet.curScale = {sx: scaleX, sy:scaleY, originalScale: false};
							shapeSet.initScale = {sx: scaleX, sy:scaleY, originalScale: false};
							if (highlighted_set.length != 0){
								highlighted_set.forEach(function (shape) {shape.attr({"fill": "#GGG"})});
								highlighted_set = paper.set();
								board_piece_set = new Array();
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
						shapeSet.mousePageX = e.pageX - e.offsetX + shapeSet.initBBox.x;
						shapeSet.mousePageY = e.pageY - e.offsetY + shapeSet.initBBox.y;
						shapeSet.animate({"opacity": 0.5}, 0);
					}
					else {
						var validPosition = blokus.utils.valid(shapeSet.board_piece_set);
						if(validPosition){
							shapeSet.isSelected = false;
							var xrot = shapeSet.initBBox.x + shapeSet.initBBox.width/2;
							var yrot = shapeSet.initBBox.y + shapeSet.initBBox.height/2;
							var rotation = shapeSet.rotation * 90;
							//if(shapeSet.rotation % 2 != 0){
								//xrot += 0;
								//yrot -= 12.5;
							//}
							var tmp_x = shapeSet.destCor.x;
							var tmp_y = shapeSet.destCor.y;
							var sy = 1;
							var sx = 1;
							var ssx = shapeSet.initBBox.x;
							var ssy = shapeSet.initBBox.y;
							if (tmp_x == shapeSet.initBBox.x && tmp_y == shapeSet.initBBox.y){
								sx = shapeSet.initScale.sx;
								sy = shapeSet.initScale.sy;
								ssx = tmp_x;
								ssy = tmp_y;
								tmp_x = 0;
								tmp_y = 0;
							}
							window.cur = shapeSet;
							shapeSet.animate(
								{transform: "t"+tmp_x+" "+tmp_y+"s"+sx+" "+sy+" "+ssx+" "+ssy+"r"+rotation+" "+xrot+" "+yrot},
								//{transform: "t"+tmp_x+" "+tmp_y+"s"+sx+" "+sy+" "+ssx+" "+ssy},
								500);
							shapeSet.animate({"opacity": 1}, 500);

							shapeSet.board_piece_set.forEach(function (cor) {blokus.board.get("gridPlaced")[cor.x][cor.y] = gameview.game.get("colourTurn")[0]});
							//shapeSet.animate({transform:"r180,75,73"}, 500) //around the center of the shape set
							//console.log("t"+tmp_x+" "+tmp_y+"s"+sx+" "+sy+" "
							// +ssx+" "+ssy+"r"+rotation+" "+xrot+" "+yrot);
						}
					}
				}
			);
			blokus.mapKeyDown(37,
				function () {
					if(shapeSet.isSelected){
						var xrot = shapeSet.initBBox.x + shapeSet.initBBox.width/2;
						var yrot = shapeSet.initBBox.y + shapeSet.initBBox.height/2;
						shapeSet.rotate(90, xrot, yrot);
						shapeSet.rotation += 1;
					}
				}
			);
			blokus.mapKeyDown(39,
				function () {
					if(shapeSet.isSelected){
						var xrot = shapeSet.initBBox.x + shapeSet.initBBox.width/2;
						var yrot = shapeSet.initBBox.y + shapeSet.initBBox.height/2;
						shapeSet.rotate(-90, xrot, yrot);
						shapeSet.rotation -= 1;
					}
				}
			);
			return shapeSet;
		}

	});
}(jQuery, _, Backbone, blokus));
