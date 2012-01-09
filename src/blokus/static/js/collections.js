// Define the collections used by blokus
(function ($, _, Backbone) {
	var Collection = Backbone.Collection.extend({
		url: function () { return this.resourceUrl + "?limit=0"; },
		parse: function(response) { return response.objects; }
	});

	var UserCollection = Collection.extend({ model: blokus.User, resourceUrl: blokus.urls.user }),
		UserProfileCollection = Collection.extend({ model: blokus.UserProfile, resourceUrl: blokus.urls.user }),
		GameCollection = Collection.extend({ model: blokus.Game, resourceUrl: blokus.urls.game }),
		PieceMasterCollection = Collection.extend({ model: blokus.PieceMaster, resourceUrl: blokus.urls.pieceMaster }),
		PieceCollection = Collection.extend({ model: blokus.Piece }),
		PlayerCollection = Backbone.Collection.extend({ model: blokus.Player });

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
				{ id: 0, user_id: 10, colour: "red", pieces: [
					{ piece_master_id: 3, x: 0, y: 2, client_rotation: 1, client_flip: 1 }
				]},
				{ id: 1, user_id: 13, colour: "green", pieces: [
					{ piece_master_id: 16, x: 5, y: 1, client_rotation: 2 }
				]},
				{ id: 2, user_id: 12, colour: "blue", pieces: [
					{ piece_master_id: 8, x: 10, y: 2, client_rotation: 0 }
				]},
				{ id: 3, user_id: 11, colour: "yellow", pieces: [
					{ piece_master_id: 1, x: 10, y: 13, client_rotation: 0 },
					{ piece_master_id: 12, x: 2, y: 15, client_rotation: 1, client_flip: 1 }
				]}
			]
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