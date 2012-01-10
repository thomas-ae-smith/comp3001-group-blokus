window.blokus = (function ($, _, Backbone, Raphael) {		// Create the blokus core module
	"use strict";
	var DEBUG = true,										// DEBUG = true for logging to console
		restRootUrl = "/api/rest/",
		keyDownMappings = {},								// Maps of key-codes to array of functions to call when key is released
		authDfd = undefined,
		keyUpMappings = {},									// Maps of key-codes to array of functions to call when key is pressed
		blokusDeferreds = [];								// List of jQuery Deferred objects to be resolved before starting blokus
		
	var getCurrentUser = function(callback) {
		$.ajax({ // Get currently logged in user (or anonymous user if not logged in)
			url: "/get_logged_in_user/",
  			dataType: 'json',
			success: function (model) {
				blokus.user.set(model);
				blokus.userProfile.set(model.userprofile);
				blokus._exampleGames[1].players[0].user = blokus.user.get("id"); // FIXME TEMP
				authDfd.resolve();
				if (callback != null) callback();
			},
			error: function () {
				blokus.showError("Failed to create guest user account!");
				authDfd.reject();
			}
		});
	};

	$(document).ready(function () {							// Note below, a "view" in the following context is what might be considered a "page" - lobby, game, help etc
		var currentView,									// Reference to the current view
			blokus = window.blokus,
			switchToView = function (view) {				// Switch to a different view
				var game_id = blokus.userProfile.get("game_id");
				if (game_id != null) {
					view = new blokus.GameView({ id: game_id });
				}
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
				
				//Ensure input field labels are hidden if they contain text
				$('input, textarea').each(function() {
					var input = $(this);
					if (input.val()) {
						input.prev('span').css('visibility', 'hidden')
					}
				});
			};

		blokus.router = new (Backbone.Router.extend({		// Make a new router, which binds hash-urls to events. Each hash-url should load a view.
			routes: {
				"": "lobby",								// When there is no hash url
				"game/:id": "game",							// Eg #game/12
				"help": "help",
				"register": "register",
				"profile": "profile"
			},
			lobby: function () { switchToView(new blokus.LobbyView()); },
			game: function (id) { switchToView(new blokus.GameView({ id: id })); },
			help: function () { switchToView(new blokus.HelpView()); },
			register: function () { switchToView(new blokus.RegisterView()); },
			profile: function () { switchToView(new blokus.ProfileView()); }
		}))();

		authDfd = new $.Deferred();
		blokusDeferreds.push(authDfd);

		getCurrentUser(null);

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


	Array.prototype.clean = function(deleteValue) { //remove a given value from the files
		for (var i = 0; i < this.length; i++) {
			if (this[i] == deleteValue) {         
				this.splice(i, 1);
				i--;
			}
		}
		return this;
	};

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
		getCurrentUser: getCurrentUser,
		urls: {
			user: restRootUrl + "user/",
			userProfile: restRootUrl + "userprofile/",
			game: restRootUrl + "game/",
			pieceMaster: restRootUrl + "piecemaster/",
			player: restRootUrl + "player/",
			piece: restRootUrl + "piece/"
		},
		mapKeyUp: function (keyCode, callback) {			// Bind a function to a key being released
			if (!keyUpMappings.hasOwnProperty(keyCode)) { keyUpMappings[keyCode] = []; }
			keyUpMappings[keyCode].push(callback);
		},
		mapKeyDown: function (keyCode, callback) {			// Bind a function to a key being pressed
			if (!keyDownMappings.hasOwnProperty(keyCode)) { keyDownMappings[keyCode] = []; }
			keyDownMappings[keyCode].push(callback);
		},
		haloArr: new Array()
	};
}(jQuery, _, Backbone, Raphael));
