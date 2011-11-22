// Define the models used by blokus
(function ($, _, Backbone) {
	var User = Backbone.Model.extend({
			defaults: {
				id: undefined,
				name: undefined
			}
		}),

		UserProfile = Backbone.Model.extend({
			defaults: {
				userId: undefined,
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
		User: User,
		UserProfile: UserProfile,
		Game: Game,
		PieceMaster: PieceMaster,
		Piece: Piece,
		Player: Player
	});
}(jQuery, _, Backbone));