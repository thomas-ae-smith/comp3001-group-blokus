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
			switchToView = function (view, new_game_id) {				// Switch to a different view
				var game_id = blokus.userProfile.get("game_id");
				if (game_id != null && new_game_id != game_id) {
					blokus.showYesNo("You are currently in a game. Would you like to continue it?", function () {
						blokus.router.navigate("game/" + game_id, true);
					}, function () {
						blokus.waiting(true);
						blokus.userProfile.save({ status: "offline" }, { success: function () {
							blokus.waiting(false);
						}});
					}, true);
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
				"lobby": "lobby",
				"lobby/:hash": "privatelobby",
				"game/:id": "game",
				"register": "register"
			},
			lobby: function () { switchToView(new blokus.LobbyView()); },
			privatelobby: function(hash) {
				var lobbyView = new blokus.LobbyView();
				switchToView(lobbyView);
				lobbyView.selectGameType("private", null, hash);
			},
			game: function (id) { switchToView(new blokus.GameView({ id: id }), id); },
			register: function () { switchToView(new blokus.RegisterView()); }
		}))();

		authDfd = new $.Deferred();
		blokusDeferreds.push(authDfd);

		getCurrentUser(null);

		$(window).keyup(function (e) {
			_(keyUpMappings[e.keyCode]).each(function (f) { f.call(); });
		}).keydown(function (e) {
			_(keyDownMappings[e.keyCode]).each(function (f) { f.call(); });
		});

		$(window).bind('beforeunload', function(){
			if (blokus.userProfile.get("game_id") == null) {
				blokus.userProfile.save({status: "offline"});
			} else {
				return "Are you sure you wish to quit."
			}
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

	var msgPersist = false;

	return {
		DEBUG: DEBUG,
		log: function () { if (DEBUG) console.log.apply(console, arguments); },
		error: function () { if (DEBUG) console.error.apply(console, arguments); },
		showError: function (msg) {
			var $error = $('<div class="error">' + msg + '</div>').hide();
			$("#errorstack").append($error);
			$error.slideDown();
			$error.click(function() { $error.slideUp(); });
		},
		showMsg: function (msg, timeout, persist) {
			if (msgPersist) return;
			var $msg = $("#msgcontainer").fadeIn();
			$msg.find(".content").html(msg);
			$msg.find(".okButtons").show().siblings().hide();
			$msg.find(".close").unbind("click").click(function () { $msg.fadeOut(); });
			if (timeout) {
				setTimeout(function() { msgPersist = false; $msg.fadeOut(); }, timeout);
			}
			msgPersist = persist || false;
		},
		showYesNo: function (msg, yesCallback, noCallback, persist) {
			if (msgPersist) return;
			var $msg = $("#msgcontainer").fadeIn();
			$msg.find(".content").html(msg);
			$msg.find(".yesNoButtons").show().siblings().hide();
			$msg.find(".yes").unbind("click").click(yesCallback).click(function() { msgPersist = false; $msg.fadeOut() });
			$msg.find(".no").unbind("click").click(noCallback).click(function () { msgPersist = false; $msg.fadeOut() });
			msgPersist = persist || false;
		},
		waiting: function (on) {
			if (on) $("#blokuswaiting").fadeIn();
			else $("#blokuswaiting").fadeOut();
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
		// Get template source
		getTemplate: function (name) {
			return _.template($('#' + name + '-template').html());
		},
		haloArr: new Array()
	};
}(jQuery, _, Backbone, Raphael));