(function ($, _, Backbone, blokus) {
	var cellSize = 22;

	var colours = {
		/*
		red: '#ff0000',
		green: '#00ff00',
		blue: '#0000ff',
		yellow: '#ffff00'
		*/
		red: '/static/img/blockblue.png',
		green: '/static/img/blockgreen.png',
		blue: '/static/img/blockred.png',
		yellow: '/static/img/blockyellow.png'
	}

	function prepend0 (i) {
		return i < 10 ? "0" + i : i;
	}

	function niceTime (d) {
		return prepend0(d.getHours()) + ":" + prepend0(d.getMinutes()) + ":" + prepend0(d.getSeconds());
	}

	function dateDifference (d1, d2) {
		return new Date(Math.abs(d2.getTime() - d1.getTime()));
	}

	blokus.GameView = Backbone.View.extend({
		className: "gameview",
		game: undefined,
		paper: undefined,
		startTime: 0,
		timeNow: 0,

		render: function () {
			window.gameview = this;
			var this_ = this,
				el = this.el,
				$el = $(el),
				template = _.template($('#game-template').html());

			$el.html(template());

			var paper = this.paper = Raphael(el, 800, 660),			// Make the Raphael element 800 x 600 in this view
				game = this.game = new blokus.Game({ id: this.options.id });

			window.p = paper;

			var dfd = new $.Deferred();

			game.fetch({ success: function () {
				var dfds = [];

				_(game.players.models).each(function (player) {
					var user = player.user = new blokus.User({ id: player.get("user_id") });
					var d = new $.Deferred();
					dfds.push(d);
					user.fetch({ success: function () {
						d.resolve();
					}, error: function () {
						d.resolve();
						blokus.showError("Failed to get user information (id " + user.get("user_id") + ") for player");
					} });
				});

				$.when.apply(undefined, dfds).always(function () { dfd.resolve(); });

			}, error: function () {
				blokus.showError("Failed to fetch game");
			}});

			dfd.done(function () {
				var gamej = game.toJSON(),
					playerPanels = {},
					positionId = 0,
					gameboard = this_.gameboard = new blokus.GameBoard({
						paper: paper,
						cellSize: cellSize,
						game: game,
						gameview: this_
					}).render(),

					poller = setInterval(function () { game.fetch({ error: function () { blokus.showError("Failed to fetch game"); /* FIXME: remove? */ } }); }, 4000),	// Fetch game model every second (to determined player turn, duration, winner etc)
		        	ticker = setInterval(function () { this_.updateDuration(); }, 1000); // Keep game duration up-to-date

		        this_.bind("close", function () { clearTimeout(poller); clearTimeout(ticker); }); // Remove poller timeout when lobbyview is closed

		        game.bind("change:colour_turn", function (game, colour) {
		        	console.log("TODO New colour turn", colour);
		        	blokus.showMsg(colour + ", it is now your turn");
		        	var player = game.getPlayerOfColour(colour);
		        	if (player.get("user_id") == blokus.user.get("id")) {
		        		var playerId = player.get("id");
		        		var pos = 1;
		        		_(playerPanels).each(function (playerPanel, id) {
		        			if (playerId == id) {
		        				playerPanel.setActive(true, 0);
		        			} else {
		        				playerPanel.setActive(false, pos);
		        				pos++;
		        			}
		        		});
		        	}
		        });

		        game.bind("change:winning_colours", function (game, winning_colours) {
		        	var colours = winning_colours.split("|");
		        	console.log("TODO Player wins: ", colours);
		        });

		        game.bind("change:time_now", function (game, timeNow) { this_.updateDuration(timeNow); });

		        game.bind("change:number_of_moves", function (game, numberOfMoves) {
		        	_(game.pieces.models).each(function (piece) {
		        		gameboard.renderPiece(game.players.get(piece.get("player_id")).get("colour"), piece);
		        	});
		        });

		        this_.startTime = new Date(gamej.start_time); // FIXME Date time check compatbility
		        this_.timeNow = new Date(gamej.time_now); // FIXME Date time check compatbility

				this_.$(".uri").html(game.get("uri"));

				this_.$(".game-help").click(function () {
					$("#helpscreen").slideDown();
				});

				this_.$("#helpscreen .close").click(function () {
					$("#helpscreen").slideUp();
				})

				this_.$(".game-exit").click(function () {
					if (confirm("Are you sure you want to quit the game?")) {
						location.hash = "";
					}
				})

				// Append to view
				$el.append(gameboard.el);

				var hasPanelOnLeft = false;

				// Create all the player panels
				_(game.players.models).each(function (player) {
					var colour = player.get("colour"),
						options = { paper: paper, game: game, player: player, gameview: this_ },
						active = false;

					console.log(blokus.user.get("id"), player.get("user_id"))

					// Identify if this is the logged in user
					if (blokus.user.get("id") == player.get("user_id") && !hasPanelOnLeft) {
						active = true;
						options.active = true;
						options.positionId = 0;
						hasPanelOnLeft = false;
					} else {
						positionId++;
						options.positionId = positionId;
					}

					var playerPanel = new blokus.PlayerPanel(options);

					playerPanels[player.get("id")] = playerPanel;

					// Append to view
					$el.find(active ? ".playerpanelcontainer.left" : ".playerpanelcontainer.right").append(playerPanel.render().el);

					var unplacedPieces = new blokus.PieceCollection(),
						placedPieces = player.pieces,
						placedPieceIds = placedPieces.pluck("master_id");

					// Determine what pieces have not been placed
					_(blokus.pieceMasters.models).each(function (pieceMaster) {
						var id = Number(pieceMaster.get("id"));

						if (placedPieceIds.indexOf(id) === -1) {
							var piece = new blokus.Piece({ master_id: id, player_id: player.get("id") });
							unplacedPieces.add(piece);

							if (active) { // If logged in user
								piece.bind("piece_placed", function (x, y, flip, rotation) {
									piece.set({ x: x, y: y, flip: flip, rotation: rotation });
									game.getPlayerOfColour(colour).pieces.create(piece.toJSON(), { error: function () { blokus.showError("Piece failed to be placed.") } });

									var colourswitch = {"blue": "yellow", "yellow": "red", "red": "green", "green": "blue"};   // FIXME  temp
									game.fetch();
								});
							}
						}
					});

					gameboard.renderPieces(colour, placedPieces);
					playerPanel.renderPieces(unplacedPieces, active);
				});

				this_.$(".loading").remove();

			});
			return this;
		},

		updateDuration: function (timeNow) {
			if (timeNow) this.timeNow = new Date(timeNow);
			else this.timeNow.setSeconds(this.timeNow.getSeconds() + 1);
			this.$(".duration").html(niceTime(dateDifference(this.startTime, this.timeNow)));
		},

		//Draws a single piece
		drawPiece: function (x, y, piece, colour, scaleX, scaleY, canMove) {
			this_ = this;
			var gameboard = this.gameboard,
				paper = this.paper;
			var data = blokus.pieceMasters.get(piece.get("master_id")).get("data");

			var numRows = data.length;
			var numCols = data[0].length;
			var cells = paper.set();
			var visibleCells = paper.set();
			var invisibleCells = paper.set();
			cells.dataArr = _(data).clone();
			for (var rowI = 0; rowI < numRows; rowI++){
				for (var colJ = 0; colJ < numCols; colJ++) {
					if (data[rowI][colJ] == 1) {
						//var cell = paper.rect(x+(colJ)*cellSize, y+(rowI)*cellSize,
												//cellSize, cellSize);
						//cell.attr({fill: colours[colour]});
						var cell = paper.image(colours[colour], x+(colJ)*cellSize, y+(rowI)*cellSize,
												cellSize, cellSize);
						cell.attr({opacity: 1});
						cell.opacity = 1;
						cells.push(cell);
						visibleCells.push(cell);
					}
					else{
						//var cell = paper.rect(x+(colJ)*cellSize, y+(rowI)*cellSize,
												//cellSize, cellSize);
						//cell.attr({fill: colours[colour], opacity: 0});
						var cell = paper.image(colours[colour], x+(colJ)*cellSize, y+(rowI)*cellSize,
												cellSize, cellSize);
						cell.attr({opacity: 0});
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
					curScale: {x: scaleX, y:scaleY, originalScale: false},
					cellSize: cellSize,
					gameboardCellSize: 23,
					paper: paper,
					gameBBox: {
								sx: canvas.offset().top,
								sy: canvas.offset().left,
								width: Number(canvas.attr("width")), // does not work in firefox //canvas.width(),
								height: Number(canvas.attr("height")), // does not work in firefox //canvas.height(),
								ex: canvas.offset().left + Number(canvas.attr("width")), //canvas.width()
								ey: canvas.offset().top + Number(canvas.attr("height")) //canvas.height()
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

			if (blokus.haloArr == undefined){
				blokus.haloArr = new Array();
				Array.prototype.clean = function(deleteValue) {
					for (var i = 0; i < this.length; i++) {
						if (this[i] == deleteValue) {         
							this.splice(i, 1);
							i--;
							}
						}
						return this;
					};
			}

			// TODO Check if the pieces dont overide each other
			//shapeSet.board_piece_set = new Array();
			$(window).mousemove(
				function(e){
					//on move
					if (shape.isSelected){
						shape.calVisibleBBox();

						shape.calDistTravel(e);
						shape.moveShape();
						shape.inBoardValidation(gameboard, paper.set());
					}
					else{
						if(blokus.haloArr.length != 0){
							var i = 0;
							_(blokus.haloArr).each(function (s){
								s.boundaryCircle.toFront();
								if (s.boundaryCircle != paper.getElementByPoint(e.pageX, e.pageY)){
									s.removeHalo();
									s.haloOn = false;
									blokus.haloArr[i] = undefined;
								}
								s.boundaryCircle.toBack();
								i++;
							});
							blokus.haloArr.clean(undefined);	
						}
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
								_(corOnBoard).forEach(function (cor) {blokus.board.get("gridPlaced")[cor.x][cor.y] = gameview.game.get("colour_turn")[0]});
								piece.trigger("piece_placed", shape.posInGameboard.x, shape.posInGameboard.y, this.flipNum, shape.getRotation());
							}
						}
					}
				}
			);
			shape.cells.mouseover(function () {
				if(!shape.isSelected){
					var s = shape.halo(gameboard);
					blokus.haloArr.push(s);
				}
			});
				
			blokus.mapKeyDown(37,
				function () {
					shape.rotate(-1, gameboard);
				}
			);
			blokus.mapKeyDown(39,
				function () {
					shape.rotate(1, gameboard);
				}
			);
			blokus.mapKeyDown(86, // v
				function (){
					shape.flip(2, gameboard);
				}
			);
			blokus.mapKeyDown(72, // h
				function (){
					shape.flip(1, gameboard);
				}
			);
			return shape.cells;
		}

	});
}(jQuery, _, Backbone, blokus));
