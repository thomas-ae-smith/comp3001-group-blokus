// Define the models used by blokus
(function ($, _, Backbone) {
	var UserProfile = Backbone.Model.extend({
			defaults: {
				id: undefined,
				name: undefined,
				wins: undefined,
				losses: undefined
			}
		}),

		Game = Backbone.Model.extend({
			defaults: {
				id: undefined,
				playerIds: undefined,
				colourTurn: undefined // Colour whose turn it is
			}
		}),

		PieceMaster = Backbone.Model.extend({
			defaults: {
				id: undefined,
				data: undefined
			}
		}),

		Piece = Backbone.Model.extend({
			defaults: {
				id: undefined,
				x: undefined,
				y: undefined,
				rotation: undefined,
				flip: undefined
			}
		}),

		Player = Backbone.Model.extend({
			defaults: {
				id: undefined,
				userId: undefined,
				colours: undefined
			}
		});
	
	_(window.blokus).extend({
		Game: Game,
		PieceMaster: PieceMaster,
		Piece: Piece,
		Player: Player
	});
}(jQuery, _, Backbone));