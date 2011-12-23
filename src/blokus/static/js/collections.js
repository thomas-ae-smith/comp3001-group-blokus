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


	// TEMP: Hard coded players
	var users = new UserCollection([
		{ id: 10, name: "zanders3" },
		{ id: 11, name: "timzo" },
		{ id: 12, name: "bob" },
		{ id: 13, name: "superzico" },
	]);

	var games = new GameCollection([
		{
			id: 0,
			name: "game 1",
			selected: true,
			colourTurn: "red",
			players: new PlayerCollection([
				{ id: 0, userId: 10, colours: [ "red" ] },
				{ id: 1, userId: 13, colours: [ "green" ] },
				{ id: 2, userId: 12, colours: [ "blue" ] },
				{ id: 3, userId: 11, colours: [ "yellow" ] },
			]),
			pieces: {
				red: new PieceCollection([
					/* Unplaced pieces */
					{ master: 0 }, { master: 1 }, { master: 2 },
					/* Placed pieces. Identified by non-negative x value? */
					{ master: 3, x: 0, y: 2, flip: 1 }
				]),
				green: new PieceCollection([
					{ master: 0 }, { master: 2, rotation: 1 }, { master: 3 },
					{ master: 1, x: 5, y: 1, rotation: 2 }
				]),
				blue: new PieceCollection([
					{ master: 0 }, { master: 3, flip: 1 }, { master: 2 },
					{ master: 1, x: 10, y: 2, rotation: 0 }
				]),
				yellow: new PieceCollection([
					{ master: 3 }, { master: 1 }, { master: 2 },
					{ master: 0, x: 10, y: 13, rotation: 0 }
				])
			}
		},
		{ id: 1, name: "the colourblinds" /* players */ },
		{ id: 2, name: "battle of teh awsumz" /* players */ }
	]);


	_(window.blokus).extend({
		UserCollection: UserCollection,
		UserProfileCollection: UserProfileCollection,
		GameCollection: GameCollection,
		PieceMasterCollection: PieceMasterCollection,
		PieceCollection: PieceCollection,
		PlayerCollection: PlayerCollection,

		users: users,
		games: games
	});
}(jQuery, _, Backbone));