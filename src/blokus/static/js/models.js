// Define the models used by blokus
(function ($, _, Backbone) {
	function getIdFromUrl (url) {
		return Number((url.charAt(url.length-1) === "/" ? url.slice(0, url.length-1) : url).split("/").pop());
	}

	var Model = Backbone.Model.extend({
		url: function () {
			if (this.resourceUrl) return this.resourceUrl + (this.hasOwnProperty("id") ? this.id + "/" : "");
			else if (this.collection) return this.collection.resourceUrl + (this.hasOwnProperty("id") ? this.id + "/" : "");
			else throw "Does not have resource url or collection";
		}
	});

	var User = Model.extend({ resourceUrl: blokus.urls.user }),
		UserProfile = Model.extend({ resourceUrl: blokus.urls.userProfile }),
		Game = Model.extend({
			resourceUrl: blokus.urls.game,

			url: function () {
				return this.resourceUrl + (this.hasOwnProperty("id") ? this.id + "/" : "") +
						(this.has("number_of_moves") ? "?state=" + this.get("number_of_moves") : "");
			},

			parse: function (model) {
				this.players = new blokus.PlayerCollection(model.players);

				_(this.players.models).each(function (player) {
					var pieces = player.pieces = new blokus.PieceCollection(player.get("pieces"));
					_(pieces.models).each(function (piece) {
						piece.set({ master_id: getIdFromUrl(piece.get("master")), player_id: getIdFromUrl(piece.get("player")) });
					});
					player.set({ user_id: getIdFromUrl(player.get("user")) });
				});

				return model;
			},

			getPlayerOfColour: function (colour) {
				return _(this.players.models).find(function (player) {
					return player.get("colour") === colour;
				});
			}
		}),

		PieceMaster = Model.extend({ resourceUrl: blokus.urls.pieceMaster }),

		Piece = Model.extend({
			defaults: { rotation: 0, flip: 0 },
			initialize: function () {
				var this_ = this;
				this.bind("change", function () {
					this_.set({
						player: blokus.urls.player + this_.get("player_id") + "/",
						master: blokus.urls.pieceMaster + this_.get("master_id") + "/"
					});
				});
			}
		}),

		Player = Model.extend({
			resourceUrl: blokus.urls.player,
			getId: function () { return getIdFromUrl(this.get("user")); },
			isLoggedInPlayer: function () { return getIdFromUrl(this.get("user")) == blokus.user.get("id"); },
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