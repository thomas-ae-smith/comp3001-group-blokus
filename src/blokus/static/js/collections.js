// Define the collections used by blokus
(function ($, _, Backbone) {
	var Collection = Backbone.Collection.extend({
		url: function () { return this.resourceUrl + "?limit=0"; },
		parse: function(response) { return response.objects; }
	});

	_(window.blokus).extend({
		UserCollection: Collection.extend({ model: blokus.User, resourceUrl: blokus.urls.user }),
		UserProfileCollection: Collection.extend({ model: blokus.UserProfile, resourceUrl: blokus.urls.user }),
		GameCollection: Collection.extend({ model: blokus.Game, resourceUrl: blokus.urls.game }),
		PieceMasterCollection: Collection.extend({ model: blokus.PieceMaster, resourceUrl: blokus.urls.pieceMaster }),
		PieceCollection: Collection.extend({ model: blokus.Piece, resourceUrl: blokus.urls.piece }),
		PlayerCollection: Backbone.Collection.extend({ model: blokus.Player, resourceUrl: blokus.urls.player })
	});
}(jQuery, _, Backbone));
