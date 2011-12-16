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
			parse: function (model) {
		        // Set the user profile
		        blokus.userProfile.set(model.userProfile);
		        model.unset(userProfile, { silent: true });

				return model;
			}
		}),

		UserProfile = Model.extend({
			resourceUrl: blokus.urls.userProfile
		}),

		Game = Model.extend({
			resourceUrl: blokus.urls.game,

			// Hacked in bootstrap, baby
			fetch: function (options) {
				this.set(blokus.games.at(0).toJSON());
				options.success.call();
			}
		}),

		PieceMaster = Model.extend({
			resourceUrl: blokus.urls.pieceMaster
		}),

		Piece = Model.extend({
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