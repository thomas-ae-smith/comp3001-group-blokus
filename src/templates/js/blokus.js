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

	//Ensure HTML 5 elements are styled by IE
	document.createElement('header');
	document.createElement('nav');
	document.createElement('section');
	document.createElement('article');
	document.createElement('aside');
	
	var drawPlayer = function(paper, x, y, name){
		paper.rect(x, y, 250, 110, 5).attr("fill", "#E3EEF2");
		paper.text(x + 8, y + 10, name).attr({
			"text-anchor":"start",
			"font-family":"Tahoma",
			"font-weight":"bold",
			"font-size":14
		});
	};
	
	$(document).ready(function(){
		var paper = Raphael("gameboard", 800, 600);
		var players = ["zanders3", "timzo", "bob", "superzico"];
		
		//Player list with pieces
		var y = 30;
		for (var i in players) {
			drawPlayer(paper, 10, y, players[i]);
			y += 120;
		}
		
		//Gameboard
		paper.rect(290, 10, 510, 510, 5).attr("fill", "#GGGGGG");
		paper.rect(295, 15, 500, 500).attr("fill", "#AAAAAA");
	});

	return {
		DEBUG: DEBUG,
		log: function () { if (DEBUG) console.log.apply(console, arguments); },
		error: function () { if (DEBUG) console.error.apply(console, arguments); },
		urls: urls,
	};

}(jQuery, _, Backbone, Raphael));