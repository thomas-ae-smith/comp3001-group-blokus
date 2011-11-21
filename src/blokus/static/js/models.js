// Define the models used by blokus
(function ($, _, Backbone) {
	var MakeModel = Backbone.Model.extend;

	var UserProfile = MakeModel({
			defaults: {
				id: undefined,
				name: undefined,
				wins: undefined,
				losses: undefined
			}
		}),

		Game = MakeModel({
			defaults: {
				id: undefined,
				playerIds: undefined,
				colourTurn: undefined // Colour whose turn it is
			}
		}),

		PieceMaster = MakeModel({
			defaults: {
				id: undefined,
				data: undefined
			}
		}),

		Piece = MakeModel({
			defaults: {
				id: undefined,
				x: undefined,
				y: undefined,
				rotation: undefined,
				flip: undefined
			}
		}),

		Player = MakeModel({
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