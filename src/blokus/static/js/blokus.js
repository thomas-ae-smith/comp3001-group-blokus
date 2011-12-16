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
		},

		keyDownMappings = {},
		keyUpMappings = {},

		mapKeyDown = function (keyCode, callback) {
			if (!keyDownMappings.hasOwnProperty(keyCode)) {
				keyDownMappings[keyCode] = [];
			}
			keyDownMappings[keyCode].push(callback);
		},

		mapKeyUp = function (keyCode, callback) {
			if (!keyUpMappings.hasOwnProperty(keyCode)) {
				keyUpMappings[keyCode] = [];
			}
			keyUpMappings[keyCode].push(callback);
		};

	// Ensure HTML 5 elements are styled by IE
	document.createElement('header');
	document.createElement('nav');
	document.createElement('section');
	document.createElement('article');
	document.createElement('aside');


	$(document).ready(function () {

		var currentView;

		// Switch to a different view (lobby, game, help etc)
		function switchToView (view) {
			var oldView = currentView,
				// render new view
				$newview = $(view.render().el);

			if (oldView) {
				// Fade out old view then remove
				$(oldView.el).fadeOut(200, function () {
					oldView.remove();
				});
			}

			currentView = view;

			// Fade in new view
			$("#container").append($newview);
		}

		// Make a new router
		blokus.router = new (Backbone.Router.extend({
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
			// HACK
			location = "/login";

			var username = $("#loginUsername").html(),
				password = $("#loginPassword").html();
			
			$.ajax({
				url: "/login",
				type: "POST",
				data: {
					username: username,
					password: password
				},
				success: function (model) {
					blokus.user.set(model);
					blokus.user.fetch();
				},
				error: function () {
					// TODO
				}
			})

	        return false;
		});

		// Handle sign out
		$("#profileMenu #signout-button").click(function () {
			// Log out
			$.ajax({
				url: "/logout",
				success: function (model) {
		        	blokus.user.set(model);
				},
				error: function () {
					// TODO
				}
			})
		});

		// One the logged in user is known, show user information (or login is user is anonymous)
        blokus.user.bind("change", function () {
        	var name = blokus.user.get("username");
        	if (!name || name === "anon") {
	        	$("#signedInMenu").hide();
		        $("#signedOutMenu").show();
		        $("#profileButton .name").html("Sign in");
	        	positionProfileMenu();
            } else {
	        	$("#signedInMenu").show();
		        $("#signedOutMenu").hide();
		        $("#profileButton .name").html(name);
	        	positionProfileMenu();
	        }
        });

        // Get currently logged in user (or anonymous user if not logged in)
        $.ajax({
        	url: "/get_logged_in_user",
        	success: function (model) {
		        blokus.user.set(model);
        	},
        	error: function () {
        		// TODO
        		blokus.user.clear()
        	}
        });

		// When window loads or is resized, Set profile/login panel position to below button 
		$(window).bind("resize load", positionProfileMenu);

		$(window).keyup(function (e) {
			blokus.log("Key up. Key code: " + e.keyCode);
			if (keyUpMappings.hasOwnProperty(e.keyCode)) {
				_(keyUpMappings[e.keyCode]).each(function (f) { f.call() });
			}
		}).keydown(function (e) {
			blokus.log("Key down. Key code: " + e.keyCode);
			if (keyDownMappings.hasOwnProperty(e.keyCode)) {
				_(keyDownMappings[e.keyCode]).each(function (f) { f.call() });
			}
		});

	});

	return {
		DEBUG: DEBUG,
		log: function () { if (DEBUG) console.log.apply(console, arguments); },
		error: function () { if (DEBUG) console.error.apply(console, arguments); },
		urls: urls,
		mapKeyUp: mapKeyUp,
		mapKeyDown: mapKeyDown,
		game: undefined,
		user: undefined
	};

}(jQuery, _, Backbone, Raphael));