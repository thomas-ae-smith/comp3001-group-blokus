// Create the blokus core module
window.blokus = (function ($, _, Backbone, Raphael) {
	"use strict";

	var DEBUG = true,

		// URLs for REST
		restRootUrl = "/api/rest/",

		urls = {
			user: restRootUrl + "user/",
			userProfile: restRootUrl + "userProfile/",
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

		// Switch to a different view (lobby, game, help etc)
		function switchToView (view) {
			var $oldview = $("#container > div"),
				// render new view
				$newview = $(view.render().el);
			
			// Fade out old view then remove
			$oldview.fadeOut(200, function () { $oldview.remove(); });
			// Fade in new view
			$("#container").append($newview);
		}

		// Make a new router
		new (Backbone.Router.extend({
			routes: {
				"": "lobby",
				"game/:id": "game",
				"help": "help",
				"register": "register",
				"forgot": "forgot",
				"profile/:id": "profile"
			},

			lobby: 		function () 	{ switchToView(new blokus.LobbyView()); },
			game: 		function (id) 	{ switchToView(new blokus.GameView({ id: id })); },
			help: 		function () 	{ switchToView(new blokus.HelpView()); },
			register: 	function () 	{ switchToView(new blokus.RegisterView()); },
			forgot: 	function () 	{ switchToView(new blokus.ForgotView()); },
			profile: 	function (id) 	{ switchToView(new blokus.ProfileView({ id: id })); }
		}));

		// Start backbone history to allow routing
		Backbone.history.start();

		var $profileButton = $("#profileButton"),
			$profileMenu = $("#profileMenu"),
			mouseInProfilePanel = false,
			panelMouseOutTimeouts = [],

			hideProfileMenu = function () {
		        $profileMenu.slideUp();
		        $profileButton.removeClass("sel");
			},

			positionProfileMenu = function () {
				var buttonOffset = $profileButton.offset();

		        $profileMenu.css({
	                'left': buttonOffset.left - $profileMenu.outerWidth() + $profileButton.outerWidth(),
	                'top': buttonOffset.top + $profileButton.outerHeight()
		        });
			};

		// Make profile/login panel visible when moving mouse onto profile button or menu
		$("#profileButton, #profileMenu").mouseover(function() {
			mouseInProfilePanel = true;
	        $profileMenu.slideDown();
	        $profileButton.addClass("sel");
	        // clear all timeouts
	        _(panelMouseOutTimeouts).each(clearTimeout);
	        panelMouseOutTimeouts = [];
		}).mouseout(function () {
			mouseInProfilePanel = false;
			// Close panel 200ms after mouse leaves
			panelMouseOutTimeouts.push(setTimeout(function () {
				if (!mouseInProfilePanel) {
					hideProfileMenu();
			    }
			}, 300));
		});

		$("#profileMenu a").click(hideProfileMenu);

		// Handle sign in
		$("#profileMenu #signin-button").click(function () {
			var name = "zanders3";
			$("#signedOutMenu").hide();
	        $("#signedInMenu").show();
	        $("#profileButton").html(name + " ▾");
	        positionProfileMenu();
	        return false;
		});

		// Handle sign out
		$("#profileMenu #signout-button").click(function () {
			$("#signedInMenu").hide();
	        $("#signedOutMenu").show();
	        $("#profileButton").html("Sign in  ▾");
	        positionProfileMenu()
		});

		// When window loads or is resized, Set profile/login panel position to below button 
		$(window).bind("resize load", positionProfileMenu);

	});

	return {
		DEBUG: DEBUG,
		log: function () { if (DEBUG) console.log.apply(console, arguments); },
		error: function () { if (DEBUG) console.error.apply(console, arguments); },
		urls: urls
	};

}(jQuery, _, Backbone, Raphael));
