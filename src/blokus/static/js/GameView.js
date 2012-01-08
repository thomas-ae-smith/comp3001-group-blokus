(function ($, _, Backbone, blokus) {
	var cellSize = 22;

	var colours = {
		red: '#ff0000',
		green: '#00ff00',
		blue: '#0000ff',
		yellow: '#ffff00'
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
					var colour = player.get("colour"),
						options = { paper: paper, game: game, player: player, gameview: this_ },
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
					playerPanel.renderPieces(unplacedPieces, active);
				});

				this_.$(".loading").remove();
			}, error: function () {
				blokus.showError("Failed to fetch game");
			}});
			return this;
		},

		//Draws a single piece
		drawPiece: function (x, y, data, colour, scaleX, scaleY, canMove) {
			var gameboard = this.gameboard,
				paper = this.paper;

			var numRows = data.length;
			var numCols = data[0].length;
			var cells = paper.set();
			var visibleCells = paper.set();
			var invisibleCells = paper.set();
			cells.dataArr = _(data).clone();
			for (var rowI = 0; rowI < numRows; rowI++){
				for (var colJ = 0; colJ < numCols; colJ++) {
					if (data[rowI][colJ] == 1) {
						var cell = paper.rect(x+(colJ)*cellSize, y+(rowI)*cellSize,
												cellSize, cellSize);
						cell.attr({fill: colours[colour]});
						cell.opacity = 1;
						cells.push(cell);
						visibleCells.push(cell);
					}
					else{
						var cell = paper.rect(x+(colJ)*cellSize, y+(rowI)*cellSize,
												cellSize, cellSize);
						cell.attr({fill: colours[colour], opacity: 0});
						cell.opacity = 0;
						cells.push(cell);
						invisibleCells.push(cell);
					}
				}
			}
			var canvas = $(paper.canvas);
			var shape = new blokus.shape(
				{
					dataArr: _(data).clone(), 
					cells: cells,
					visibleCells: visibleCells,
					canMove: canMove,
					invisibleCells: invisibleCells,
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
							  },
					gameboardBBox: {
								sx: gameboard.offset.x, // start x
								sy: gameboard.offset.y, // start y
								width: gameboard.width, 
								height: gameboard.height,
								ex: gameboard.offset.x + gameboard.width, // end x
								ey: gameboard.offset.y + gameboard.height  // end y
							  }
				}
			);

			var highlighted_set = new paper.set();
			// TODO Check if the pieces dont overide each other
			//shapeSet.board_piece_set = new Array();
			$(window).mousemove(
				function(e){
					//on move
					if (shape.isSelected){
						shape.calVisibleBBox();

						shape.calDistTravel(e);
						shape.moveShape();
						shape.inBoardValidation(gameboard, new paper.set());
					}
				}
			);
			shape.cells.click(
				function (e, x, y){
					// on Start
					if(!shape.isSelected)
						shape.selectShape(e);
					else {
						if(shape.notInPanel){
							shape.returnToPanel();
						}
						else{
							var corOnBoard = shape.getCorOnBoard();
							var validPosition = blokus.utils.valid(corOnBoard);
							if(validPosition){
								shape.isSelected = false;
								shape.goToPos();
								_(corOnBoard).forEach(function (cor) {blokus.board.get("gridPlaced")[cor.x][cor.y] = gameview.game.get("colourTurn")[0]});
							}
						}
					}
				}
			);
			blokus.mapKeyDown(37,
				function () {
					shape.rotate(-1, gameboard, new paper.set());
				}
			);
			blokus.mapKeyDown(39,
				function () {
					shape.rotate(1, gameboard, new paper.set());
				}
			);
			return shape.cells;
		}

	});
}(jQuery, _, Backbone, blokus));
