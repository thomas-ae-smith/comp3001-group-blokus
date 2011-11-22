// Define the models used by blokus
(function ($, _, Backbone) {
	var Model = Backbone.Model.extend({
		url : function () {
            if (this.get('resource_uri')) {
                return this.get('resource_uri');
            } else if (this.collection) {
                return this.collection.url + this.id + "/";
            } else {
                throw "Does not have resource url or collection";
            }
        }
	});
	var User = Model.extend({
			defaults: {
				id: undefined,
				name: undefined
			}
		}),

		UserProfile = Model.extend({
			defaults: {
				userId: undefined,
				wins: undefined,
				losses: undefined
			}
		}),

		Game = Model.extend({
			defaults: {
				id: undefined,
				playerIds: undefined,
				colourTurn: undefined // Colour whose turn it is
			}
		}),

		PieceMaster = Model.extend({
			defaults: {
				id: undefined,
				data: undefined
			}
		}),

		Piece = Model.extend({
			defaults: {
				id: undefined,
				x: undefined,
				y: undefined,
				rotation: undefined,
				flip: undefined
			}
		}),

		Player = Model.extend({
			defaults: {
				id: undefined,
				userId: undefined,
				colours: undefined
			}
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