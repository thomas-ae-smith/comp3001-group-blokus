// Create the blokus module
window.blokus = (function ($, _, Backbone, Raphael) {

	var DEBUG = true,
		
		// URLs for REST
		urls = {
			game: "/api/rest/game/",
			pieceMaster: "/api/rest/piece-master/",
			piece: "/api/rest/piece/",
			player: "/api/rest/player/"
		};

	function createBoard() {
		
	}

	$(document).ready(function () {
		
		createBoard();
	});

	return {
		DEBUG: DEBUG,
		log: function () { if (DEBUG) console.log.apply(console, arguments); },
		error: function () { if (DEBUG) console.error.apply(console, arguments); },
		urls: urls,
	};

}(jQuery, _, Backbone, Raphael));