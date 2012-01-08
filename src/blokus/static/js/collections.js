// Define the collections used by blokus
(function ($, _, Backbone) {
	var Collection = Backbone.Collection.extend({
		url: function () {
			console.log("Jko")
			return this.resourceUrl + "?limit=0";
		},
		parse: function(response) {
			return response.objects;
		}
	});

	var UserCollection = Collection.extend({
			model: blokus.User,
			resourceUrl: blokus.urls.user
		}),
		UserProfileCollection = Collection.extend({
			model: blokus.UserProfile,
			resourceUrl: blokus.urls.user
		}),
		GameCollection = Collection.extend({
			model: blokus.Game,
			resourceUrl: blokus.urls.game
		}),

		PieceMasterCollection = Collection.extend({
			model: blokus.PieceMaster,
			resourceUrl: blokus.urls.pieceMaster
		}),

		PieceCollection = Collection.extend({
			model: blokus.Piece
		}),

		PlayerCollection = Backbone.Collection.extend({
			model: blokus.Player
		});

		// FIXME: temp bootstrap (until server-side done)
		var _exampleGames = [
			{ id: 0, name: "the colourblinds" /* players */ },
			{
				id: 1,
				name: "game 1",
				selected: true,
				colour_turn: "blue",
				start_time: "Sun Jan 08 2012 17:26:59 GMT+0000 (GMT)",
				time_now: "Sun Jan 08 2012 17:26:59 GMT+0000 (GMT)",
				uri: "KE90D1",
				players: [
					{ id: 0, userId: 10, colour: "red" },
					{ id: 1, userId: 13, colour: "green" },
					{ id: 2, userId: 12, colour: "blue" },
					{ id: 3, userId: 11, colour: "yellow" },
				],
				pieces: {
					red: [
						{ pieceMasterId: 3, x: 0, y: 2, flip: 1 }
					],
					green: [
						{ pieceMasterId: 16, x: 5, y: 1, rotation: 2 }
					],
					blue: [
						{ pieceMasterId: 8, x: 10, y: 2, rotation: 0 }
					],
					yellow: [
						{ pieceMasterId: 1, x: 10, y: 13, rotation: 0 },
						{ pieceMasterId: 12, x: 2, y: 15, rotation: 1, flip: 1 }
					]
				}
			},
			{ id: 2, name: "battle of teh awsumz" /* players */ }
		],

		_exampleUsers = [
			{ id: 10, name: "zanders3" },
			{ id: 11, name: "timzo" },
			{ id: 12, name: "bob" },
			{ id: 13, name: "superzico" },
		];

	_(window.blokus).extend({
		UserCollection: UserCollection,
		UserProfileCollection: UserProfileCollection,
		GameCollection: GameCollection,
		PieceMasterCollection: PieceMasterCollection,
		PieceCollection: PieceCollection,
		PlayerCollection: PlayerCollection,

		_exampleGames: _exampleGames,
		_exampleUsers: _exampleUsers
	});
}(jQuery, _, Backbone));