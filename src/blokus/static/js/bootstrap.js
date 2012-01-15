$(document).ready(function () {
	blokus.User.fetch = function (options) {
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
	}
	blokus.Game.fetch = function (options) {
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
	}
});