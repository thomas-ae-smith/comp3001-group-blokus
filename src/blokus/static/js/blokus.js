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
			user: restRootUrl + "userProfile/",
			game: restRootUrl + "game/",
			pieceMaster: restRootUrl + "piece-master/"
		};

	// Ensure HTML 5 elements are styled by IE
	document.createElement('header');
	document.createElement('nav');
	document.createElement('section');
	document.createElement('article');
	document.createElement('aside');


	$(document).ready(function () {

		var Router = Backbone.Router.extend({
			routes: {
				"": "lobby",
				"game/:id": "game",
				"help": "help",
				"register": "register",
				"forgot": "forgot",
				"profile/:id": "profile"
			},

			lobby: function () {
				var view = new blokus.LobbyView();
				$("#container").html("").append(view.render().el);
			},

			game: function (id) {
				var view = new blokus.GameView({ id: id });
				$("#container").html("").append(view.render().el);
			},

			help: function () {
				var view = new blokus.HelpView();
				$("#container").html("").append(view.render().el);
			},

			register: function () {
				var view = new blokus.RegisterView();
				$("#container").html("").append(view.render().el);
			},

			forgot: function () {
				var view = new blokus.ForgotView();
				$("#container").html("").append(view.render().el);
			},

			profile: function (id) {
				var view = new blokus.ProfileView({ id: id });
				$("#container").html("").append(view.render().el);
			}
		});

		new Router();

		Backbone.history.start();

		positionProfileMenu();



		// TEMP HACK
		if (location.href.indexOf("game") > -1) {


		} else if (location.href.indexOf("lobby") > -1) {
			/*var gameList = new blokus.GameList({ games: games });
			$("#lobbylist-container").append(gameList.render().el);*/

		} else {
			/*
			var gameboard = new blokus.GameBoard({ game: games.get(0) });
			$("#container").append(gameboard.render().el);
			// Temp gameboard
			blokus.gameboard = gameboard;
			//Temp just show that I can draw things
			data = blokus.pieceMasters.get(3).get("data");
			shape_set = blokus.drawPiece(50,23,data, gameboard)
			*/
		}

	});

	return {
		DEBUG: DEBUG,
		log: function () { if (DEBUG) console.log.apply(console, arguments); },
		error: function () { if (DEBUG) console.error.apply(console, arguments); },
		urls: urls
	};

}(jQuery, _, Backbone, Raphael));
