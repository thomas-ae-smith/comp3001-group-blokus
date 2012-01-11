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

	var User = Model.extend({
			resourceUrl: blokus.urls.user,

			// FIXME: Hacked in bootstrap, baby
			fetch: function (options) {
				if (this.get("id") > 13) { // TODO remove
					return Model.prototype.fetch.apply(this, arguments);
				}
				var this_ = this,
					dfd = new $.Deferred();
					id = Number(this_.get("id")),
					model = _(blokus._exampleUsers).find(function (user) {
						return user.id === id;
					});

				if (!model) {
					if (options && options.error) {
						options.error.call(undefined, {}, {status: 404});
						dfd.reject();
					}
				} else {
					this.set(this.parse(model));
					if (options && options.success) {
						options.success.call();
						dfd.resolve();
					}
				}
				return dfd;
			},
		}),
		UserProfile = Model.extend({ resourceUrl: blokus.urls.userProfile }),
		Game = Model.extend({
			resourceUrl: blokus.urls.game,

			url: function () {
				return this.resourceUrl + (this.hasOwnProperty("id") ? this.id + "/" : "") +
						(this.has("state") ? "?state=" + this.get("number_of_moves") : "");
			},

			// FIXME: Hacked in bootstrap, baby
			fetch: function (options) {
				if (this.get("id") > 1) { // TODO remove
					return Model.prototype.fetch.apply(this, arguments);
				}
				var this_ = this,
					dfd = new $.Deferred();
					id = Number(this_.get("id")),
					model = _(blokus._exampleGames).find(function (game) {
						return game.id === id;
					});

				if (!model) {
					if (options && options.error) {
						options.error.call(undefined, {}, {status: 404});
						dfd.reject();
					}
				} else {
					this.set(this.parse(model));
					if (options && options.success) setTimeout(function(){
						options.success.call();
						dfd.resolve();
					},100);
				}
				return dfd;
			},

			parse: function (model) {
				if (!this.players) {
					this.players = new blokus.PlayerCollection(model.players);
				}
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

		PieceMaster = Model.extend({
			resourceUrl: blokus.urls.pieceMaster,

			parse: function (model) {
				model.id = Number(model.id);
				return model;
			}
		}),

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
			getId: function () {
				return getIdFromUrl(this.get("user"));
			}
		}),

		Board = Model.extend({
		initialize: function(){
						var numXCells = 20;
						var numYCells = 20;
						var grid = new Array(numXCells);
						var gridPlaced = new Array(numXCells);

						for (var iBoard=0; iBoard<numXCells ; iBoard++) {
							grid[iBoard] = new Array(numYCells);
							gridPlaced[iBoard] = new Array(numYCells);
							for (var jBoard=0; jBoard<numYCells; jBoard++) {
								var cell = 0;
								grid[iBoard][jBoard] = cell;
								gridPlaced[iBoard][jBoard] = '0';
							}
						}
						this.set({
									numXCells: numXCells,
									numYCells: numYCells,
									grid: grid,
									gridPlaced: gridPlaced
								});
					}
		}),

		// Will be the logged in user
		user = new User(),
		userProfile = new UserProfile(),
		board = new Board();


    userProfile.bind("change:game_id", function (user, gameId) {
        //blokus.router.navigate(gameId ? "game/" + id : "", true);
    });

	_(window.blokus).extend({
		User: User,
		UserProfile: UserProfile,
		Game: Game,
		PieceMaster: PieceMaster,
		Piece: Piece,
		Player: Player,
		user: user,
		userProfile: userProfile,
		board: board
	});
}(jQuery, _, Backbone));
