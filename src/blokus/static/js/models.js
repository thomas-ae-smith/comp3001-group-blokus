// Define the models used by blokus
(function ($, _, Backbone) {
	var Model = Backbone.Model.extend({
		url : function () {
			if (this.resourceUrl) {
	            return this.resourceUrl + (this.hasOwnProperty("id") ? this.id + "/" : "");
            } else if (this.collection) {
                return this.collection.url + this.id + "/";
            } else {
                throw "Does not have resource url or collection";
            }
        }
	});
	var User = Model.extend({
			resourceUrl: blokus.urls.user,

			// FIXME: Hacked in bootstrap, baby
			fetch: function (options) {
				var this_ = this,
					id = Number(this_.get("id")),
					model = _(blokus._exampleUsers).find(function (user) {
						return user.id === id;
					});

				if (!model) {
					if (options.error) options.error.call(undefined, {}, {status: 404});
				} else {
					this.set(this.parse(model));
					if (options.success) options.success.call();
				}
			},

			parse: function (model) {
		        // Set the user profile
		        // FIXME: blokus.userProfile.set(model.userProfile);

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
					if (options.error) options.error.call(undefined, {}, {status: 404});
				} else {
					this.set(this.parse(model));
					if (options.success) options.success.call();
				}
			},

			parse: function (model) {
				model.players = new blokus.PieceCollection(model.players);
				model.pieces = new blokus.PieceCollection(model.pieces);
				model.pieces.url = this.url() + "piece/";
				model.players.url = this.url() + "player/";
				return model;
			}
		}),

		PieceMaster = Model.extend({
			resourceUrl: blokus.urls.pieceMaster,

			parse: function (model) {
				var rows = model.piece_data.split(","),
					data = [];
				// convert data string to multi-dimensional array of 1s and 0s
				_(rows).each(function (row) {
					var newRow = [];
					_(row.split("")).each(function (char) {
						newRow.push(Number(char));
					})
					data.push(newRow);
				});
				model.data = data;
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

		// Will be the logged in user
		user = new User(),
		userProfile = new UserProfile();


	_(window.blokus).extend({
		User: User,
		UserProfile: UserProfile,
		Game: Game,
		PieceMaster: PieceMaster,
		Piece: Piece,
		Player: Player,

		user: user,
		userProfile: userProfile
	});
}(jQuery, _, Backbone));