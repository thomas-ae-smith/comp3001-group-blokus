﻿// Create the blokus core module
window.blokus = (function ($, _, Backbone, Raphael) {
	"use strict";

	// DEBUG = true for logging to console
	var DEBUG = true,

		// URLs for REST
		restRootUrl = "/api/rest/",
		urls = {
			user: restRootUrl + "user/",
			userProfile: restRootUrl + "userProfile/",
			game: restRootUrl + "game/",
			pieceMaster: restRootUrl + "piecemaster/"
		},

		// Maps of key-codes to array of functions to call when key is pressed/released
		keyDownMappings = {},
		keyUpMappings = {},

		// Bind a function to a key being pressed
		mapKeyDown = function (keyCode, callback) {
			if (!keyDownMappings.hasOwnProperty(keyCode)) {
				keyDownMappings[keyCode] = [];
			}
			keyDownMappings[keyCode].push(callback);
		},

		// Bind a function to a key being released
		mapKeyUp = function (keyCode, callback) {
			if (!keyUpMappings.hasOwnProperty(keyCode)) {
				keyUpMappings[keyCode] = [];
			}
			keyUpMappings[keyCode].push(callback);
		},

		// List of jQuery Deferred objects to be resolved before starting blokus
		blokusDeferreds = [];

	// Ensure HTML 5 elements are styled by IE
	document.createElement('header');
	document.createElement('nav');
	document.createElement('section');
	document.createElement('article');
	document.createElement('aside');

	// When the document is ready
	$(document).ready(function () {
		// Note below, a "view" in the following context is what might be considered a "page" - lobby, game, help etc

		// Reference to the current view
		var currentView;

		// Switch to a different view
		function switchToView (view) {
			var oldView = currentView,
				// Render new view
				$newview = $(view.render().el);

			if (oldView) {
				// Fade out old view then remove
				$(oldView.el).fadeOut(200, function () {
					// Remove DOM element
					oldView.remove();
					// Run any view-specific cleanup operations
					oldView.trigger("close");
					// Unbind any event bindings (to avoid object not being garbage-collected)
					oldView.unbind();
				});
			}

			currentView = view;

			// Fade in new view
			$("#container").append($newview);
		}

		// Make a new router, which binds hash-urls to events. Each hash-url should load a view.
		blokus.router = new (Backbone.Router.extend({
			routes: {
				"": "lobby",			// When there is no hash url
				"game/:id": "game",		// Eg #game/12
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

		// To be run once everything is ready
		function startBlokusApp() {
			// Start backbone history to allow router to work
			Backbone.history.start();
		}

		// Handle sign in
		$("#signin-button").click(function () {
			// HACK
			location = "/login/";

			var username = $("#loginUsername").html(),
				password = $("#loginPassword").html();

			$.ajax({
				url: "/login/",
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
					$("#error").html("Invalid username or password!").show();
				}
			})

	        return false;
		});

		// Handle sign out
		$("#signout-button").click(function () {
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
        	var name = blokus.user.get("name");
        	if (!name || name === "anon") {
	        	$("#username").text("Guest");
				$("#profileInfo p").text("Please login to save your scores");
				$("#profileMenu").hide();
				$("#signedOut").show();
            } else {
	        	$("#username").text(name);
				$("#profileInfo p").text("wins: 0 losses: 0");
				$("#profileMenu").show();
				$("#signedOut").hide();
	        }
        });

        // Get currently logged in user (or anonymous user if not logged in)
        /*$.ajax({
        	url: "/get_logged_in_user",
        	success: function (model) {
		        blokus.user.set(model);
        	},
        	error: function () {
        		// TODO
        		blokus.user.clear()
        	}
        });*/
        // HACK
        var u = new blokus.User({id : 10});
        u.fetch();
        blokus.user.set(u);

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

		blokus.pieceMasters = new blokus.PieceMasterCollection();
		blokusDeferreds.push(blokus.pieceMasters.fetch());

		$.when.apply(undefined, blokusDeferreds).then(startBlokusApp);

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
