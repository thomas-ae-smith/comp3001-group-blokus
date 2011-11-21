// Create the blokus core module
window.blokus = (function ($, _, Backbone, Raphael) {

	var DEBUG = true,
		
		// URLs for REST
		urls = {
			game: "/api/rest/game/",
			pieceMaster: "/api/rest/piece-master/",
			piece: "/api/rest/piece/",
			player: "/api/rest/player/"
		};

	// Ensure HTML 5 elements are styled by IE
	document.createElement('header');
	document.createElement('nav');
	document.createElement('section');
	document.createElement('article');
	document.createElement('aside');
	
	$(document).ready(function(){
		

		// TEMP HACK
		if (location.href.indexOf("game") > -1) {
			

		} else if (location.href.indexOf("lobby") > -1) {
			var gameCollection = new blokus.GameCollection([
				{ id: 0, name: "game 1", selected: true },
				{ id: 1, name: "the colourblinds" },
				{ id: 2, name: "battle of teh awsumz" }
			]);
			var gameList = new blokus.GameList({ gameCollection: gameCollection });
			$("#lobbylist-container").append(gameList.render().el);
		} else {
			// TEMP: Hard coded players
			var players = new blokus.PlayerCollection([
				{ name: "zanders3" },
				{ name: "timzo" },
				{ name: "bob" },
				{ name: "superzico" }
			]);

			var gameboard = new blokus.GameBoard({ players: players });
			$("#container").append(gameboard.render().el);
		}
	});

	return {
		DEBUG: DEBUG,
		log: function () { if (DEBUG) console.log.apply(console, arguments); },
		error: function () { if (DEBUG) console.error.apply(console, arguments); },
		urls: urls,
	};

}(jQuery, _, Backbone, Raphael));