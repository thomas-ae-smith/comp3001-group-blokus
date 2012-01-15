(function ($, _, Backbone, blokus, Raphael) {
	"use strict";

	// Prepends a 0 onto a number that is less that 10. Eg 9 becomes 09.
	function prepend0 (i) {
		return i < 10 ? "0" + i : i;
	}

	// Formats a date ob ject into hours:minutes:seconds (11:00:12)
	function niceTime (d) {
		return prepend0(d.getHours()) + ":" + prepend0(d.getMinutes()) + ":" + prepend0(d.getSeconds());
	}

	// Calculates difference in two dates and produces a new date
	function dateDifference (d1, d2) {
		return new Date(Math.abs(d2.getTime() - d1.getTime()));
	}

	var errors = {
		fetchGame: "Failed to fetch game",
		placePiece: "Piece failed to be placed."
	};

	var _panelOffsets = [
		{ x: 0, y: 125 },
		{ x: 670, y: 95 },
		{ x: 670, y: 295 },
		{ x: 670, y: 495 },
	];
	var _panelDimensions = [
		{ w: 132, h: 535 },
		{ w: 132, h: 165 },
		{ w: 132, h: 165 },
		{ w: 132, h: 165 }
	];


	var GameBoard = Backbone.View.extend({
		offset: { x: 175, y: 125 },
		borderWidth: 30,
		width: undefined,
		height: undefined,
		cellSize: undefined,
		border: 1,
		className: "gameboard",
		grid: undefined,

		initialize: function(){
			this.cellSize = this.options.cellSize;
			this.width = this.cellSize * 20;
			this.height = this.cellSize * 20;
		},

		render: function () {
			var paper = this.options.paper,
				cellSize = this.options.cellSize,
				cols = [];
			this.grid = new Array(20);
			// Render the border
			paper.rect(this.offset.x - this.borderWidth, this.offset.y - this.borderWidth, this.width + this.borderWidth * 2,this.height + this.borderWidth * 2, 10)
				 .attr("fill", "url('/static/img/wood.jpg')").glow();
			// Render the background
			paper.rect(this.offset.x, this.offset.y, this.width, this.height)
				 .attr("fill", "url('/static/img/wood_light.jpg')").glow();
			// Render the inset border
			paper.rect(this.offset.x, this.offset.y, this.width, this.height)
				 .attr("stroke", "black").glow();

			// Render 20x20 grid
			for (var x = 0; x < 20; x++) {
				var row = [];
				cols.push(row);
				for (var y = 0; y < 20; y++) {
					var cell = paper.rect(this.offset.x + x * cellSize, this.offset.y + y * cellSize, cellSize - this.border, cellSize - this.border);
					cell.attr("fill", "#GGG");
					row.push(cell);
				}
				this.grid[x] = row;
			}
			return this;
		},

		makeTransparent: function(){
			for (var x = 0; x < 20; x++) {
				for (var y = 0; y < 20; y++) {
					this.grid[x][y].attr("fill", "#GGG");
				}
			}
		}
	});


	var PlayerPanel = Backbone.View.extend({
		className: "playerpanel",
		shapes: {},
		pos: 0,

		render: function () {
			var $el = $(this.el),
				player = this.options.player,
				template = blokus.getTemplate("player-panel");

			var profile = player.user.get("userprofile");
			$el.html(template({
				name: player.user.get("username"),
				pic: "/static/img/noavatar.jpg",
				stats: profile != null ? "wins: " + profile.wins + " losses: " + profile.losses : ""
			}));

			return this;
		},

		setPosition: function (pos) {
			this.pos = pos;
			this.isActive = pos == 0;
			this.isEnabled = this.isLoggedInPlayer();

			var turnText = $(this.el).find("#turntext");
			turnText.find('div').html("Waiting for " + this.options.player.user.get("username") + "...");
			if (this.isEnabled || !this.isActive) {
				turnText.hide();
			} else {
				turnText.show();
			}
			this.isEnabled = true;
			if (this.isActive) {
				$(".playerpanelcontainer.left").append(this.el);
			} else {
				$(".playerpanelcontainer.right").append(this.el);
			}
			var boundaries = this.getBoundaries();
			this.shapePositions = blokus.utils.makePositionArray(boundaries.sx, boundaries.sy, boundaries.width, boundaries.height);
		},

		getPosition: function () { return this.pos; },

		isEnabled: false,
		isActive: false,

		isLoggedInPlayer: function () { return this.options.player.isLoggedInPlayer(); },

		getBoundaries: function () {
			var offsets = _panelOffsets[this.pos],
				dimensions = _panelDimensions[this.pos];
			return {
				sx: offsets.x,
				sy: offsets.y,
				ex: offsets.x + dimensions.w,
				ey: offsets.y + dimensions.h,
				width: dimensions.w,
				height: dimensions.h
			};
		}

	});

	// The game screen
	blokus.GameView = Backbone.View.extend({
		className: "gameview",
		game: undefined,

		render: function () {
			var this_ = this,
				template = blokus.getTemplate("game"), // Get the template source
				game = this.game = new blokus.Game({ id: this.options.id });  // Create client side representation of game model

			$(this.el).html(template());		// Render template

			var paper = Raphael(this.el, 800, 660);		// Make the Raphael element 800 x 600 in this view

			/* Render game board */
			var gameboard = new GameBoard({ paper: paper, cellSize: 22 }).render();

			// Append to view
			$(this.el).append(gameboard.el);


			/* For player panels */
			var playerPanels = {};


			/* Render shapes */
			var colours = ["red", "green", "blue", "yellow"],
				shapes = {};
			_(colours).each(function (colour) {
				// Map of shape_master_id to shape object
				shapes[colour] = {};

				_(blokus.pieceMasters.models).each(function (pieceMaster) {
					var id = pieceMaster.get("id");

					// Create a new shape
					var shape = shapes[colour][id] = new blokus.Shape({
						pieceMaster: pieceMaster,
						gameboard: gameboard,
						paper: paper,
						colour: colour
					});

					// When this shape is placed on the board, update the model
					shape.bind("piece_placed", function (pieceMaster, x, y, flip, rotation, successCallback, errorCallback) {
						var activePlayer = game.getPlayerOfColour(game.get("colour_turn"));
						var activePlayerId = activePlayer.get("id");

						_(game.players.models).each(function (player) {
							if (player.get("id") == activePlayerId){
								activePlayer = player;
							}
						});


						var activePlayer = game.getPlayerOfColour(game.get("colour_turn"));
						var activePlayerId = activePlayer.get("id");

						_(game.players.models).each(function (player) {
							if (player.get("id") == activePlayerId){
								activePlayer = player;
							}
						});


						// Disable all pieces of that colour
						_(shapes[colour]).each(function (shape) {
							shape.canMove = false;
						});

						// Create the piece in the game model
						game.getPlayerOfColour(colour).pieces.create(
								{ master: pieceMaster.url(), x: x, y: y, flip: flip, rotation: rotation, player:activePlayer.url()},
								{
									success: function () { successCallback.call(); },
									error: function (model, fail, xhr) {
										blokus.showError(errors.placePiece);
										if (blokus.DEBUG) blokus.showError(fail.responseText);
										errorCallback.call();
									}
								});

						// Ask for the updated game model
						poll(true);
					});
				});
			});


			/* Game polling */
			var polling = true,
				fetchFailedCount = 0,
				waiting = false,
				lastMove = 0,
				// Fetch game model every few seconds to determined player turn, duration, winner etc
				poll = function (dontPollAgain) {
					if (polling) {
						$.ajax({
							url: "/get_move/" + game.get("id") + "/",
							success: function (ret) {
								var moveNumber = Number(ret);
								fetchFailedCount = 0;
								if (moveNumber != lastMove && !waiting) {
									// It is set to false when the turn has been handled
									blokus.utils.set_block_validation(true);
									waiting = true;
									game.fetch({
										success: function () {
											waiting = false;
											lastMove = moveNumber;
										},
										error: function () {
											waiting = false;
										}
									})
								}
							},
							error: function () {
								if (fetchFailedCount > 3) blokus.showError(errors.fetchGame);
							}
						}).always(function () { if (!dontPollAgain) setTimeout(poll, 1000); }); // Call this function 2 seconds after fetch succeeded/failed;
					}
				};


			/* Keep game duration up-to-date using server time to avoid discrepancies between clients */
			var startTime,
				timeNow,
				playerStartTime = null,
				// Every second, increment the time now. Accepts a time argument from server to indicate current time
				updateDuration = function (newTimeNow) {
					if (!startTime) return;
					if (newTimeNow) timeNow = new Date(newTimeNow);
					else timeNow.setSeconds(timeNow.getSeconds() + 1);
					this_.$(".duration").html(niceTime(dateDifference(startTime, timeNow)));

					if (playerStartTime != null) this_.$(".playerduration").html(niceTime(dateDifference(playerStartTime, timeNow)));
				},
				ticker = setInterval(updateDuration, 1000);

			/* Handle winners */
			function handleGameOver (game, is_over) {
				if (!is_over) return;
				polling = false;
				clearTimeout(ticker);
				blokus.utils.set_block_validation(true);
				var msg = "<h4>SCORES</h4>";
				_(game.players.models).each(function (player) {
					console.log(player);
					window.p = player;
					if(p.user == undefined)
						setTimeout(function(){msg += "<p>"+player.user.get("username")+": "+player.get("score")+"</p>";}, 100);
					else {
						msg += "<p>"+player.user.get("username")+": "+player.get("score")+"</p>";
					}
				});

				blokus.showMsg(msg, undefined, true, function() {
					blokus.waiting(true);
					blokus.userProfile.save({ status: "offline" }, { success: function () {
						blokus.userProfile.fetch({ success: function () {
							blokus.router.navigate("lobby", true);
							blokus.waiting(false);
						}});
					}});
				});
			}


			/* Initial setting up of game */
			var isInit = true;
			function init () {
				if (!isInit) return;

				/* Fetch all the users */
				// List of jQuery deferred objects used so that game does not render until all user information has been fetched
				var dfds = [];

				_(game.players.models).each(function (player) {
					var user = player.user = new blokus.User({ id: player.getId() }),
						d = new $.Deferred();
					dfds.push(d);
					user.fetch({ success: function () {
						d.resolve();
					}, error: function () {
						d.resolve();
						blokus.showError("Failed to get user information (id " + user.get("user_id") + ") for player");
					} });
				});

				//handleGameOver(game, game.get("game_over"));

				/* When all users are fetched */
				$.when.apply(undefined, dfds).always(function () {
					// Set up panels for all players
					_(game.players.models).each(function (player) {
						var id = player.get("id");
						playerPanels[id] = new PlayerPanel({ player: player }).render();
					});

					// Initialize game view
					startTime = new Date(game.get("start_time"));
					timeNow = new Date(game.get("time_now"));
					handleTurn(game, game.get("colour_turn"));
					handlePlacedPieces(game, game.get("number_of_moves"), true);

					// Start polling
					poll();

					// Remove loading animation
					this_.$(".loading").remove();
				});

				isInit = false;
			}

			/* Handle change in colour turn */
			function handleTurn (game, colour) {
				var activePlayer = game.getPlayerOfColour(colour),
					activePlayerId = activePlayer.get("id");

				/* Move panel to left if active player, otherwise right */
				var pos = 1;
				_(playerPanels).each(function (panel, playerId) {
					var player = game.players.get(Number(playerId)),
						colour = player.get("colour");
					// Move the panel
					if (playerId == activePlayerId) {
						panel.setPosition(0);
					} else {
						panel.setPosition(pos);
						pos++;
					}
					gameboard.makeTransparent();
					// Move all players unplaced shapes to new panel position
					_(shapes[colour]).each(function (shape) {
						if (shape.isInPanel()) shape.moveToPanel(panel);
					});
				});

				// Indicate whose player's turn it is
				var skipButton = $(".game-skip");
				var prettyColourName = colour.charAt(0).toUpperCase() + colour.slice(1);
				if (activePlayer.get("user_id") == blokus.user.get("id")) {
					skipButton.show();
					blokus.utils.set_block_validation(false);
					blokus.showMsg(prettyColourName + ", it is now your turn", 2500);
				} else {
					skipButton.hide()
					blokus.showMsg(prettyColourName + "'s turn", 2500);
				}

				//Note it is set to true when the turn has changed in polling
				blokus.waiting(false)
				blokus.utils.set_block_validation(false);
				playerStartTime = new Date(game.get("turn_start"));
			}

			/* Handle pieces being placed */
			function handlePlacedPieces (game, numberOfMoves, init) {
				_(game.players.models).each(function (player) {
					if (player.isLoggedInPlayer() && !init) return;
					var colour = player.get("colour");
					_(player.pieces.models).each(function (piece) {
						var pieceMasterId = Number(piece.get("master_id"));
						window.pkk = shapes[colour][pieceMasterId]
						// Move the piece onto the game board at specified location
						shapes[colour][pieceMasterId].moveToGameboard(piece.get("x"), piece.get("y"), piece.get("flip"), piece.get("rotation"));
					});
				});
			}

			/* Setting up view */
			// Fetch the game
			game.fetch({ success: init, error: function () {
				blokus.router.navigate("lobby", true);
				blokus.showMsg("This game does not exist any more.")
			} });
			// Bind handlers
			game.bind("change", function () {
				if (game.players.length < 4) {
					blokus.showYesNo("Some players of this game have left so it has been ended. Would you like to return to the lobby?", function () {
						blokus.waiting(true);
						blokus.userProfile.save({ status: "offline" }, { success: function () {
							blokus.userProfile.fetch({ success: function () {
								blokus.router.navigate("lobby", true);
								blokus.waiting(false);
							}});
						} });
					}, null, true);
				}

				if (game.hasChanged("number_of_moves")) handlePlacedPieces(game, game.get("number_of_moves"));
				if (game.hasChanged("colour_turn")) setTimeout(function () { handleTurn(game, game.get("colour_turn")); }, 1000);
				//if (game.hasChanged("game_over")) handleGameOver(game, game.get("game_over"));
				if (game.hasChanged("time_now")) updateDuration(game.get("time_now"));
			});


			/* Make help screen function */
			this_.$(".game-help").click(function () {
				if (this_.help == true) {
					$("#helpscreen").slideUp();
					this_.help = false;
				} else {
					$("#helpscreen").slideDown();
					this_.help = true;
				}
			});

			this_.$("#helpscreen .close").click(function () {
				$("#helpscreen").slideUp();
				this_.help = false;
			});

			/* Handle closing the game */
			this_.$(".game-exit").click(function () {
				blokus.showYesNo("Are you sure you want to quit the game?", function () {
					blokus.waiting(true);
					blokus.userProfile.save({ status: "offline" }, { success: function () {
						blokus.userProfile.fetch({ success: function () {
							blokus.router.navigate("lobby", true);
							blokus.waiting(false);
						}});
					}});
				}, null, true);
			});

			this_.$(".game-skip").click(function () {
				blokus.waiting(true);
				$.ajax({
					url: "/skip_move/" + this_.game.getPlayerTurn().get("id") + "/",
					error: function() {
						blokus.waiting(false);
						blokus.showError("Failed to skip move");
					}
				});
			});

			this_.bind("close", function () { polling = false; clearTimeout(ticker); }); // Remove poller timeout when lobbyview is closed

			//Add the game clock
			var clock = new blokus.Clock({paper:paper, center:{x:773, y:30}}).render();
			window.gameview = this;

			return this;
		}

	});


}(jQuery, _, Backbone, blokus, Raphael));
