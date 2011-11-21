// Define the collections used by blokus
(function ($, _, Backbone) {
	var GameCollection = Backbone.Collection.extend({
			model: blokus.Game,
			url: blokus.urls.game
		}),
		
		PieceMasterCollection = Backbone.Collection.extend({
			model: blokus.PieceMaster,
			url: blokus.urls.pieceMaster
		}),

		PieceCollection = Backbone.Collection.extend({
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
		}
	]);

	// Temp hard-coded pieces
	var pieces = new PieceCollection();

	pieces.add([
		{
			pieceMaster: 2,
			rotation: 0,
			x: 2,
			y: 9,
			flip: true,
			colour: "red"
		},
		{
			pieceMaster: 0,
			rotation: 1,
			x: 4,
			y: 2,
			flip: false,
			colour: "blue"
		}
	]);

	_(window.blokus).extend({
		GameCollection: GameCollection,
		PieceMasterCollection: PieceMasterCollection,
		PieceCollection: PieceCollection,
		PlayerCollection: PlayerCollection,

		pieceMasters: pieceMasters,
		pieces: pieces
	});
}(jQuery, _, Backbone));