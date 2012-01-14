
// FIXME: temp bootstrap (until server-side done)
blokus._exampleGames = [
	{ id: 0, name: "the colourblinds" /* players */ },
	{
		id: 1,
		name: "game 1",
		selected: true,
		colour_turn: "blue",
		start_time: "Sun Jan 08 2012 17:26:59 GMT+0000 (GMT)",
		time_now: "Sun Jan 08 2012 17:26:59 GMT+0000 (GMT)",
		uri: "KE90D1",
		players: [
			{ id: 0, user: "/10/", colour: "red", pieces: [
				{ master: "/3", player: "0", x: 0, y: 2, rotation: 1, flip: 1 }
			]},
			{ id: 1, user: "13", colour: "green", pieces: [
				{ master: "16", player: "1", x: 5, y: 1, rotation: 2 }
			]},
			{ id: 2, user: "12", colour: "blue", pieces: [
				{ master: "8", player: "2", x: 10, y: 2, rotation: 0 }
			]},
			{ id: 3, user: "11", colour: "yellow", pieces: [
				{ master: "1", player: "3", x: 10, y: 13, rotation: 0 },
				{ master: "12", player: "3",x: 2, y: 15, rotation: 1, flip: 1 }
			]}
		]
	},
	{ id: 2, name: "battle of teh awsumz" /* players */ }
];

blokus._exampleUsers = [
	{ id: 10, username: "zanders3" },
	{ id: 11, username: "timzo" },
	{ id: 12, username: "bob" },
	{ id: 13, username: "superzico" },
];
$(document).ready(function () {
	blokus.user.bind("change", function () {
		blokus._exampleGames[1].players[0].user = blokus.user.get("id"); // FIXME TEMP
	});
	blokus.User.fetch = function (options) {
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
	}
	blokus.Game.fetch = function (options) {
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
	}
});