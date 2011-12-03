var showProfileMenu = function() {
	$("#profileMenu").show();
	$("#profileButton").addClass("sel");
}

var hideProfileMenu = function() {
	$("#profileMenu").hide();
	$("#profileButton").removeClass("sel");
}

var signIn = function(name) {
	$("#signedOutMenu").hide();
	$("#signedInMenu").show();
	$("#profileButton").html(name + " ▾");
	positionProfileMenu();
	showProfileMenu();
}

var signOut = function() {
	$("#signedInMenu").hide();
	$("#signedOutMenu").show();
	$("#profileButton").html("Sign in  ▾");
	positionProfileMenu();
	showProfileMenu();
}

var selectMode = function(mode) {
	var buttons = $(".modelist li");
	buttons.removeClass("sel");
	buttons.eq(mode).addClass("sel");
	
	if (mode == 3){
		$("#privatelobby").slideDown("slow");
	}
	else {
		$("#privatelobby").slideUp("slow");
	}
}

//Position the profile menu underneath the profile button
var positionProfileMenu = function() {
	var profileButton = $("#profileButton");
	var buttonOffset = profileButton.offset();
	$("#profileMenu").css({
		'left': buttonOffset.left - $("#profileMenu").outerWidth() + profileButton.outerWidth(),
		'top': buttonOffset.top + profileButton.outerHeight()
	});
}

// Create the blokus core module
window.blokus = (function ($, _, Backbone, Raphael) {

	var DEBUG = true,
		
		// URLs for REST
		restRootUrl = "/api/rest/",

		urls = {
			user: restRootUrl + "user/",
			game: restRootUrl + "game/",
			pieceMaster: restRootUrl + "piece-master/",
			piece: restRootUrl + "piece/",
			player: restRootUrl + "player/"
		};

	// Ensure HTML 5 elements are styled by IE
	document.createElement('header');
	document.createElement('nav');
	document.createElement('section');
	document.createElement('article');
	document.createElement('aside');
	
	$(document).ready(function () {
	
		positionProfileMenu();
		
		// TEMP: Hard coded players
		var users = new blokus.UserCollection([
			{ id: 10, name: "zanders3" },
			{ id: 11, name: "timzo" },
			{ id: 12, name: "bob" },
			{ id: 13, name: "superzico" },
		]);

		var games = new blokus.GameCollection([
			{ 
				id: 0,
				name: "game 1",
				selected: true,
				colourTurn: "red",
				players: new blokus.PlayerCollection([
					{ id: 0, userId: 10, colours: [ "red" ] },
					{ id: 1, userId: 13, colours: [ "green" ] },
					{ id: 2, userId: 12, colours: [ "blue" ] },
					{ id: 3, userId: 11, colours: [ "yellow" ] },
				]),
				pieces: {
					red: new blokus.PieceCollection([
						/* Unplaced pieces */
						{ master: 0 }, { master: 1 }, { master: 2 },
						/* Placed pieces. Identified by non-negative x value? */
						{ master: 3, x: 0, y: 2, flip: 1 }
					]),
					green: new blokus.PieceCollection([
						{ master: 0 }, { master: 2, rotation: 1 }, { master: 3 },
						{ master: 1, x: 5, y: 1, rotation: 2 }
					]),
					blue: new blokus.PieceCollection([
						{ master: 0 }, { master: 3, flip: 1 }, { master: 2 },
						{ master: 1, x: 10, y: 2, rotation: 0 }
					]),
					yellow: new blokus.PieceCollection([
						{ master: 3 }, { master: 1 }, { master: 2 },
						{ master: 0, x: 10, y: 13, rotation: 0 }
					])
				}
			},
			{ id: 1, name: "the colourblinds" /* players */ },
			{ id: 2, name: "battle of teh awsumz" /* players */ }
		]);


		/* TEMP */
		_(blokus).extend({
			users: users,
			games: games
		})
		
		// TEMP HACK
		if (location.href.indexOf("game") > -1) {
			

		} else if (location.href.indexOf("lobby") > -1) {
			/*var gameList = new blokus.GameList({ games: games });
			$("#lobbylist-container").append(gameList.render().el);*/
			
		} else {
			var gameboard = new blokus.GameBoard({ game: games.get(0) });
			$("#container").append(gameboard.render().el);
			// Temp gameboard 
			blokus.gameboard = gameboard;
			//Temp just show that I can draw things
			data = blokus.pieceMasters.get(3).get("data");
			shape_set = blokus.drawPiece(50,23,data, gameboard)
		}
		
	});

	return {
		DEBUG: DEBUG,
		log: function () { if (DEBUG) console.log.apply(console, arguments); },
		error: function () { if (DEBUG) console.error.apply(console, arguments); },
		urls: urls,
	};

}(jQuery, _, Backbone, Raphael));
