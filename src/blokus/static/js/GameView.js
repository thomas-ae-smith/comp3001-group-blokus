(function ($, _, Backbone, blokus) {
	"use strict";
	var cellSize = 22;


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

		render: function () {
			window.gameview = this;	
			var this_ = this,
				el = this.el,
				$el = $(el),
				template = _.template($('#game-template').html()),
				game = this.game = new blokus.Game({ id: this.options.id }),
				error = function () { blokus.showError("Failed to fetch game"); /* TODO */ };
			console.log(el, paper)
			window.p = paper
			$el.html(template());

			var paper = Raphael(el, 800, 660);			// Make the Raphael element 800 x 600 in this view


			/* Render game board */
			var gameboard = new blokus.GameBoard({
				paper: paper,
				cellSize: cellSize,
			}).render();

			// Append to view
			$el.append(gameboard.el);
			

			/* For player panels */
			var playerPanels = {};


			/* Render shapes */
			var colours = ["red", "green", "blue", "yellow"],
				shapes = {};
			_(colours).each(function (colour) {
				shapes[colour] = {};
				_(blokus.pieceMasters.models).each(function (pieceMaster) {
					var id = pieceMaster.get("id");
					// Create a new shape
					var shape = new blokus.Shape({
						pieceMaster: pieceMaster,
						gameboard: gameboard,
						paper: paper,
						colour: colour 
					});
					shape.bind("piece_placed", function (x, y, flip, rotation) {
						game.getPlayerOfColour(colour).pieces.create({
							x: x,
							y: y, 
							client_flip: flip,
							client_rotation: rotation 
						}, {
							error: function () { blokus.showError("Piece failed to be placed.") } 
						});
						poll();
					});
					shapes[colour][id] = shape;
				});
			});

			/* Game polling */
			var polling = true,
				errorCount = 0,
				poll = function () {// Fetch game model every few seconds to determined player turn, duration, winner etc
					if (polling) {
						game.fetch({
							success: function () { errorCount = 0; },
							error: error
						}).always(function () {
							setTimeout(poll, 4000);
						});
					}
				};


			/* Keep game duration up-to-date */
			var startTime,
				timeNow,
				updateDuration = function (newTimeNow) {
					console.log(newTimeNow)
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
						playerPanels[id] = new blokus.PlayerPanel({
							player: player
						}).render();
					});


					startTime = new Date(game.get("start_time"));// FIXME Date time check compatbility
					timeNow = new Date(game.get("time_now"));
					handleTurn(game, game.get("colour_turn"));
		        	handlePlacedPieces(game, game.get("number_of_moves"));
		        	handleWinners(game, game.get("winning_colours"));

					// Start polling
					poll();

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
					if (playerId == activePlayerId) {
						panel.setPosition(0);
					} else {
						panel.setPosition(pos);
						pos++;
					}
					_(shapes[colour]).each(function (shape) {
						if (shape.isInPanel()) shape.moveToPanel(panel);
					});
				});

	        	if (activePlayer.get("user_id") == blokus.user.get("id")) {
	        		blokus.showMsg(colour + ", it is now your turn");
	        	} else {
	        		console.log(activePlayer.user)
	        		blokus.showMsg(colour + "'s (" + activePlayer.user.get("username") + ") turn");
	        	}
	        }

	        /* Handle pieces being placed */
	        function handlePlacedPieces (game, numberOfMoves) {
	        	_(game.players.models).each(function (player) {
	        		var colour = player.get("colour");
	        		_(player.pieces.models).each(function (piece) {
	        			var pieceMasterId = piece.get("master_id");
	        			shapes[colour][pieceMasterId].moveToGameboard(piece.get("x"), piece.get("y"), piece.get("client_flip"), piece.get("client_rotation"));
	        		});
	        	});
	        }


	        /* Handle winners */
	        function handleWinners (game, winningColours) {
	        	if (!winningColours) return;
	        	var colours = winningColours.split("|");
	        	console.log("TODO Player wins: ", colours);
	        }

			game.fetch({ success: init, error: error });
			game.bind("change:colour_turn", handleTurn);
	        game.bind("change:number_of_moves", handlePlacedPieces);
	        game.bind("change:winning_colours", handleWinners);
	        game.bind("change:time_now", function (game, timeNow) { updateDuration(timeNow); });


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

			this_.$(".game-exit").click(function () {
				if (confirm("Are you sure you want to quit the game?")) {
					location.hash = "";
				}
			});

			this_.bind("close", function () { polling = false; clearTimeout(ticker); }); // Remove poller timeout when lobbyview is closed

			this_.$(".uri").html(game.get("uri"));

	        return this;
		}

	});
}(jQuery, _, Backbone, blokus));
