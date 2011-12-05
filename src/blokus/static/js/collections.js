// Define the collections used by blokus
(function ($, _, Backbone) {
	var Collection = Backbone.Collection.extend({
		parse: function(response) {
			return response.objects;
		}
	});

	var UserCollection = Collection.extend({
			model: blokus.User,
			url: blokus.urls.user
		}),
		UserProfileCollection = Collection.extend({
			model: blokus.UserProfile,
			url: blokus.urls.user
		}),
		GameCollection = Collection.extend({
			model: blokus.Game,
			url: blokus.urls.game
		}),

		PieceMasterCollection = Collection.extend({
			model: blokus.PieceMaster,
			url: blokus.urls.pieceMaster
		}),

		PieceCollection = Collection.extend({
			model: blokus.Piece,
			url: blokus.urls.piece
		}),

		PlayerCollection = Backbone.Collection.extend({
			model: blokus.Player,
			url: blokus.urls.player
		});

	// Define the collection of piece masters
	var pieceMasters = new PieceMasterCollection();

	// TODO: replace with pieceMasters.fetch();
	pieceMasters.add([
		{
			id: 0,
			data: [	[0, 1, 0],
					[1, 1, 1],
					[0, 0, 1]	]
		},
		{
			id: 1,
			data: [	[0, 1, 0],
					[1, 1, 0]	]
		},
		{
			id: 2,
			data: [	[1, 1],
					[1, 1],
					[0, 1]	]
		},
		{
			id: 3,
			data: [	[1, 1],
					[1, 1],
					[0, 1],
					[0, 1]	]
		}
	]);

	_(window.blokus).extend({
		UserCollection: UserCollection,
		UserProfileCollection: UserProfileCollection,
		GameCollection: GameCollection,
		PieceMasterCollection: PieceMasterCollection,
		PieceCollection: PieceCollection,
		PlayerCollection: PlayerCollection,

		pieceMasters: pieceMasters
	});
}(jQuery, _, Backbone));