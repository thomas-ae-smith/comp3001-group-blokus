window.blokus = (function ($, _, Backbone, Raphael) {		// Create the blokus core module
	"use strict";
	var DEBUG = true,										// DEBUG = true for logging to console
		restRootUrl = "/api/rest/",
		keyDownMappings = {},								// Maps of key-codes to array of functions to call when key is released
		keyUpMappings = {},									// Maps of key-codes to array of functions to call when key is pressed
		blokusDeferreds = [];								// List of jQuery Deferred objects to be resolved before starting blokus

	// Ensure HTML 5 elements are styled by IE
	document.createElement('header');
	document.createElement('nav');
	document.createElement('section');
	document.createElement('article');
	document.createElement('aside');

	$(document).ready(function () {							// Note below, a "view" in the following context is what might be considered a "page" - lobby, game, help etc
		var currentView,									// Reference to the current view
			blokus = window.blokus,
			switchToView = function (view) {				// Switch to a different view
				var oldView = currentView,
					$newview = $(view.render().el);			// Render new view
				if (oldView) {
					$(oldView.el).fadeOut(200, function () {// Fade out old view then remove
						oldView.remove();
						oldView.trigger("close");			// Run any view-specific cleanup operations
						oldView.unbind();					// Unbind any event bindings (to avoid object not being garbage-collected)
					});
				}
				currentView = view;
				$("#container").append($newview);
			};

		blokus.router = new (Backbone.Router.extend({		// Make a new router, which binds hash-urls to events. Each hash-url should load a view.
			routes: {
				"": "lobby",								// When there is no hash url
				"game/:id": "game",							// Eg #game/12
				"help": "help",
				"register": "register",
				"forgot": "forgot",
				"profile/:id": "profile"
			},
			lobby: function () { switchToView(new blokus.LobbyView()); },
			game: function (id) { switchToView(new blokus.GameView({ id: id })); },
			help: function () { switchToView(new blokus.HelpView()); },
			register: function () { switchToView(new blokus.RegisterView()); },
			forgot: function () { switchToView(new blokus.ForgotView()); },
			profile: function (id) { switchToView(new blokus.ProfileView({ id: id })); }
		}))();

		$("#signin-button").click(function () {				// Handle sign in
			location.href = "/login/";						// HACK
			var username = $("#loginUsername").html(),
				password = $("#loginPassword").html();
			$.ajax({
				url: "/login/",
				type: "POST",
				data: { username: username, password: password },
				success: function (model) {
					blokus.user.set(model);
					blokus.user.fetch();
				},
				error: function () {
					blokus.showError("Invalid username or password!");
				}
			});
			return false;
		});

		$("#signout-button").click(function () {			// Handle sign out
			$.ajax({ // Log out
				url: "/logout",
				success: function (model) {
					blokus.user.set(model);
				},
				error: function () {
					blokus.showError("Failed to logout user!");
				}
			});
		});

		blokus.user.bind("change", function () {			// One the logged in user is known, show user information (or login is user is anonymous)
			var name = blokus.user.get("username");
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

		var authDfd = new $.Deferred();
		blokusDeferreds.push(authDfd);

		$.ajax({ // Get currently logged in user (or anonymous user if not logged in)
			url: "/get_logged_in_user/",
  			dataType: 'json',
			success: function (model) {
				blokus.user.set(model);
				blokus.userProfile.set(model.userprofile);
				blokus._exampleGames[1].players[0].userId = blokus.user.get("id"); // FIXME TEMP
				authDfd.resolve();
			},
			error: function () {
				$("#container").html('<b>Not logged in. Please register/login.</b><div style="color:white"><a href="/debug">Temp register</a> <a href="/login">Temp login</a></div>');
				// TODO guest accountds
				//blokus.user.clear()
				authDfd.reject();
			}
		});


		$(window).keyup(function (e) {
			_(keyUpMappings[e.keyCode]).each(function (f) { f.call(); });
		}).keydown(function (e) {
			_(keyDownMappings[e.keyCode]).each(function (f) { f.call(); });
		});

		blokus.pieceMasters = new blokus.PieceMasterCollection();
		var pieceMastersFetched = new $.Deferred()
		blokusDeferreds.push(pieceMastersFetched);
		blokus.pieceMasters.fetch({
			success: function (collection) { if (collection.length > 0) pieceMastersFetched.resolve(); else pieceMastersFetched.reject(); },
			error: function () { pieceMastersFetched.reject(); }
		});

		$.when.apply(undefined, blokusDeferreds).then(function () { Backbone.history.start(); }) // Start blokus when everything is loaded
				.fail(function () { blokus.showError("Error initializing. Failed to get pieceMasters? (Have you run syncdb?)"); });

		$("#msg .close").click(function () { $("#msg").fadeOut(); });
	});

	return {
		DEBUG: DEBUG,
		log: function () { if (DEBUG) console.log.apply(console, arguments); },
		error: function () { if (DEBUG) console.error.apply(console, arguments); },
		showError: function (msg) {
			var $error = $('<div class="error">' + msg + '</div>').hide();
			$("#errorstack").append($error);
			$error.slideDown();
			setTimeout(function () { $error.slideUp(); }, 3000);
		},
		showMsg: function (msg) {
			$("#msg").fadeIn().find(".content").html(msg);
		},
		urls: {
			user: restRootUrl + "user/",
			userProfile: restRootUrl + "userprofile/",
			game: restRootUrl + "game/",
			pieceMaster: restRootUrl + "piecemaster/"
		},
		mapKeyUp: function (keyCode, callback) {			// Bind a function to a key being released
			if (!keyUpMappings.hasOwnProperty(keyCode)) { keyUpMappings[keyCode] = []; }
			keyUpMappings[keyCode].push(callback);
		},
		mapKeyDown: function (keyCode, callback) {			// Bind a function to a key being pressed
			if (!keyDownMappings.hasOwnProperty(keyCode)) { keyDownMappings[keyCode] = []; }
			keyDownMappings[keyCode].push(callback);
		}
	};
}(jQuery, _, Backbone, Raphael));
