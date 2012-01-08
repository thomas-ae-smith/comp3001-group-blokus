// Define the models used by blokus
(function ($, _, Backbone) {
	var Model = Backbone.Model.extend({
		url : function () {
			if (this.resourceUrl) {
	            return this.resourceUrl + (this.hasOwnProperty("id") ? this.id + "/" : "");
            } else if (this.collection) {
                return this.collection.url + (this.hasOwnProperty("id") ? this.id + "/" : "");
            } else {
                throw "Does not have resource url or collection";
            }
        }
	});
	var User = Model.extend({
			resourceUrl: blokus.urls.user,

			// FIXME: Hacked in bootstrap, baby
/*			fetch: function (options) {
				var this_ = this,
					id = Number(this_.get("id")),
					model = _(blokus._exampleUsers).find(function (user) {
						return user.id === id;
					});

				if (!model) {
					if (options && options.error) options.error.call(undefined, {}, {status: 404});
				} else {
					this.set(this.parse(model));
					if (options && options.success) options.success.call();
				}
			},*/

			parse: function (model) {
				return model;
			}
		}),

		UserProfile = Model.extend({
			resourceUrl: blokus.urls.userProfile
		}),

		Game = Model.extend({
			resourceUrl: blokus.urls.game,

			// FIXME: Hacked in bootstrap, baby
			fetch: function (options) {
				var this_ = this,
					id = Number(this_.get("id")),
					model = _(blokus._exampleGames).find(function (game) {
						return game.id === id;
					});

				if (!model) {
					if (options && options.error) options.error.call(undefined, {}, {status: 404});
				} else {
					this.set(this.parse(model));
					if (options && options.success) setTimeout(function(){options.success.call();},100);
				}
			},

			parse: function (model) {
				this.players = new blokus.PlayerCollection(model.players);
				this.players.url = this.url() + "player/";
				this.pieces = {};
				this.pieces.red = new blokus.PieceCollection(model.pieces.red);
				this.pieces.blue = new blokus.PieceCollection(model.pieces.blue);
				this.pieces.green = new blokus.PieceCollection(model.pieces.green);
				this.pieces.yellow = new blokus.PieceCollection(model.pieces.yellow);
				this.pieces.red.url = this.url() + "piece/red/";
				this.pieces.blue.url = this.url() + "piece/blue/";
				this.pieces.green.url = this.url() + "piece/green/";
				this.pieces.yellow.url = this.url() + "piece/yellow/";
				return model;
			}
		}),

		PieceMaster = Model.extend({
			resourceUrl: blokus.urls.pieceMaster,

			parse: function (model) {
				model.data = model.piece_data;
				return model;
			}
		}),

		Piece = Model.extend({
			validate: function () {
				// TODO: check valid place for piece
			}
		}),

		Player = Model.extend({
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
								gridPlaced[iBoard][jBoard] = cell;
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
