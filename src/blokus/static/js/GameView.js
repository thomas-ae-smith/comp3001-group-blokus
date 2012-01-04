(function ($, _, Backbone, blokus) {
	blokus.GameView = Backbone.View.extend({
		className: "gameview",
		game: undefined,

		render: function () {
			var this_ = this,
				el = this.el,
				$el = $(el),
				game = this.game = new blokus.Game({ id: this.options.id }),
				template = _.template($('#game-template').html());
			
			$el.html(template());

			game.fetch({ success: function () {
				// Make the Raphael element 800 x 600 in this view
				var paper = Raphael(el, 800, 600),
					gamej = game.toJSON(),
					playerPanels = [],
					gameboard = new blokus.GameBoard({ paper: paper, game: game }).render();
					
				// Append to view
				$el.append(gameboard.el);

				// Create all the player panels
				_(game.players.models).each(function (player) {

					_(player.get("colours")).each(function (colour) {
						var options = { paper: paper, game: game, player: player, colour: colour },
							active = false,
							playerPanel = new blokus.PlayerPanel(options);
						
						 // Identify if this is the logged in user
						if (blokus.user.get("id") === player.get("userId")) {
							active = true;
							options.active = true;
						}

						playerPanels.push(playerPanel);

						// Append to view
						$el.find(active ? ".playerpanelcontainer.left" : ".playerpanelcontainer.right").append(playerPanel.render().el);

						var unplacedPieces = [],
							placedPieces = game.pieces[colour].pluck("pieceMasterId");

						// Determine what pieces have not been placed
						_(blokus.pieceMasters.models).each(function (pieceMaster) {
							var id = pieceMaster.get("id");

							if (placedPieces.indexOf(id) === -1) {
								unplacedPieces.push(new blokus.Piece({ pieceMasterId: id }));
							}
						});

						gameboard.renderPieces(colour, placedPieces);
						playerPanel.renderPieces(unplacedPieces);
					});
				});

			}});
			return this;
		},

	});
}(jQuery, _, Backbone, blokus));
