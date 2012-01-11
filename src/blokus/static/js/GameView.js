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
			var gameboard = new blokus.GameBoard({ paper: paper, cellSize: 22 }).render();

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
					shape.bind("piece_placed", function (x, y, flip, rotation) {
						/* FIXME temp turn progression */
						var colourswitch = {"blue": "yellow", "yellow": "red", "red": "green", "green": "blue"};
						blokus._exampleGames[1].colour_turn = colourswitch[blokus._exampleGames[1].colour_turn];

						// Create the piece in the game model
						game.getPlayerOfColour(colour).pieces.create(
								{ x: x, y: y, client_flip: flip, client_rotation: rotation },
								{ error: function () { blokus.showError(errors.placePiece) } });

						// Ask for the updated game model
						poll();
					});
				});
			});


			/* Game polling */
			var polling = true,
				fetchFailedCount = 0,
				// Fetch game model every few seconds to determined player turn, duration, winner etc
				poll = function () {
					if (polling) {
						game.fetch({
							success: function () { fetchFailedCount = 0; },
							error: function () {
								if (fetchFailedCount > 3) blokus.showError(errors.fetchGame);
							}
						}).always(function () { setTimeout(poll, 4000); }); // Call this function 4 seconds after fetch succeeded/failed
					}
				};


			/* Keep game duration up-to-date using server time to avoid discrepancies between clients */
			var startTime,
				timeNow,
				// Every second, increment the time now. Accepts a time argument from server to indicate current time
				updateDuration = function (newTimeNow) {
					if (!startTime) return;
					if (newTimeNow) timeNow = new Date(newTimeNow);
					else timeNow.setSeconds(timeNow.getSeconds() + 1);
					this_.$(".duration").html(niceTime(dateDifference(startTime, timeNow)));
				},
				ticker = setInterval(updateDuration, 1000);


			/* Initial setting up of game */
			var isInit = true;
	        function init () {
				if (!isInit) return;

				/* Fetch all the users */
				// List of jQuery deferred objects used so that game does not render until all user information has been fetched
				var dfds = [];

				_(game.players.models).each(function (player) {
					var user = player.user = new blokus.User({ id: player.get("user_id") }),
						d = new $.Deferred();
					dfds.push(d);
					user.fetch({ success: function () {
						d.resolve();
					}, error: function () {
						d.resolve();
						blokus.showError("Failed to get user information (id " + user.get("user_id") + ") for player");
					} });
				});

				/* When all users are fetched */
				$.when.apply(undefined, dfds).always(function () {
					// Set up panels for all players
					_(game.players.models).each(function (player) {
						var id = player.get("id");
						playerPanels[id] = new blokus.PlayerPanel({ player: player }).render();
					});

					// Initialize game view
					startTime = new Date(game.get("start_time"));// FIXME Date time check compatbility
					timeNow = new Date(game.get("time_now"));
					handleTurn(game, game.get("colour_turn"));
		        	handlePlacedPieces(game, game.get("number_of_moves"));
		        	handleWinners(game, game.get("winning_colours"));

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
					var player = game.players.get(playerId),
						colour = player.get("colour");
					// Move the panel
					if (playerId == activePlayerId) {
						panel.setPosition(0);
					} else {
						panel.setPosition(pos);
						pos++;
					}
					// Move all players unplaced shapes to new panel position
					_(shapes[colour]).each(function (shape) {
						if (shape.isInPanel()) shape.moveToPanel(panel);
					});
				});

				// Indicate whose player's turn it is
	        	if (activePlayer.get("user_id") == blokus.user.get("id")) {
	        		blokus.showMsg(colour + ", it is now your turn");
	        	} else {
	        		blokus.showMsg(colour + "'s (" + activePlayer.user.get("username") + ") turn");
	        	}
	        }

	        /* Handle pieces being placed */
	        function handlePlacedPieces (game, numberOfMoves) {
	        	_(game.players.models).each(function (player) {
	        		var colour = player.get("colour");
	        		_(player.pieces.models).each(function (piece) {
	        			var pieceMasterId = piece.get("master_id");
	        			// Move the piece onto the game board at specified location
	        			shapes[colour][pieceMasterId].moveToGameboard(piece.get("x"), piece.get("y"), piece.get("client_flip"), piece.get("client_rotation"));
	        		});
	        	});
	        }


	        /* Handle winners */
	        function handleWinners (game, winningColours) {
	        	if (!winningColours) return;
	        	var colours = winningColours.split("|");
	        	console.log("TODO Player wins: ", colours);  // TODO
	        }

	        /* Setting up view */
	        // Fetch the game
			game.fetch({ success: init, error: function () { blokus.showError(errors.fetchGame); } });
			// Bind handlers
			game.bind("change:colour_turn", handleTurn);
	        game.bind("change:number_of_moves", handlePlacedPieces);
	        game.bind("change:winning_colours", handleWinners);
	        game.bind("change:time_now", function (game, timeNow) { updateDuration(timeNow); });

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
				if (confirm("Are you sure you want to quit the game?")) {
					location.hash = "";
				}
			});

			this_.bind("close", function () { polling = false; clearTimeout(ticker); }); // Remove poller timeout when lobbyview is closed

			/* Indicate the url of this game */
			this_.$(".uri").html(game.get("uri"));

			window.gameview = this; // FIXME
			window.p = paper // FIXME

	        return this;
		}

	});
}(jQuery, _, Backbone, blokus, Raphael));