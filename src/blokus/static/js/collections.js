// Define the collections used by blokus
(function ($, _, Backbone) {
	var Collection = Backbone.Collection.extend({
		url: function () { return this.resourceUrl + "?limit=0"; },
		parse: function(response) { return response.objects; }
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
				{ id: 0, user: "/10/", colour: "red", pieces: [
					{ master: "/3", player: "0", x: 0, y: 2, client_rotation: 1, client_flip: 1 }
				]},
				{ id: 1, user: "13", colour: "green", pieces: [
					{ master: "16", player: "1", x: 5, y: 1, client_rotation: 2 }
				]},
				{ id: 2, user: "12", colour: "blue", pieces: [
					{ master: "8", player: "2", x: 10, y: 2, client_rotation: 0 }
				]},
				{ id: 3, user: "11", colour: "yellow", pieces: [
					{ master: "1", player: "3", x: 10, y: 13, client_rotation: 0 },
					{ master: "12", player: "3",x: 2, y: 15, client_rotation: 1, client_flip: 1 }
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
		UserCollection: Collection.extend({ model: blokus.User, resourceUrl: blokus.urls.user }),
		UserProfileCollection: Collection.extend({ model: blokus.UserProfile, resourceUrl: blokus.urls.user }),
		GameCollection: Collection.extend({ model: blokus.Game, resourceUrl: blokus.urls.game }),
		PieceMasterCollection: Collection.extend({ model: blokus.PieceMaster, resourceUrl: blokus.urls.pieceMaster }),
		PieceCollection: Collection.extend({ model: blokus.Piece, resourceUrl: blokus.urls.piece }),
		PlayerCollection: Backbone.Collection.extend({ model: blokus.Player, resourceUrl: blokus.urls.player }),

		_exampleGames: _exampleGames,
		_exampleUsers: _exampleUsers
	});
}(jQuery, _, Backbone));