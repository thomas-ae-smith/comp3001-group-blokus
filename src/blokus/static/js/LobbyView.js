blokus.LobbyView = Backbone.View.extend({
    pollUser: false,

    initialize: function () {
        var this_ = this,
            poller = setInterval(function () { // Fetch user model every second (to determined if user is yet in a game)
                if (this_.pollUser) { blokus.userProfile.fetch(); }
            }, 1000);
        this.bind("close", function () { clearTimeout(poller); }); // Remove poller timeout when lobbyview is closed
    },

	render: function () {
		var this_ = this,
			template = _.template($('#lobby-template').html()),
            options = { error: function () { blokus.showError("Failed to save user profile"); } };

		var name = blokus.user.get("username");
		var userProfile = blokus.user.get("userprofile");
		var isGuest = !name || name === "anon";
		$(this.el).html(template({
            picsrc: "/static/img/noavatar.jpg",
            name: isGuest ? "Guest" : name,
			stats: isGuest ? "Please login to save your scores" : "wins: " + userProfile.wins.toString() + " losses: " + userProfile.losses.toString(),
			hideSignOut: isGuest ? "" : "style=\"display:none;\"",
			hideProfile: isGuest ? "style=\"display:none;\"" : ""
        }));
		if (!isGuest) {
			$("#profileMenu").show();
			$("#signedOut").hide();
		}
        function selectGameType (type, title) {
            if (type == "private") {
                blokus.userProfile.save({ status: "offline" }, options);
                this_.pollUser = false;
                this_.$(".modelist").slideUp(200, function () { // Slide up
                    this_.$("#privatelobby").slideDown();
                });
            } else {
                blokus.userProfile.save({ status: type }, options);
                this_.pollUser = true;
                this_.$(".modelist").slideUp(200, function () {
                    this_.$("#waiting .title").html(title)
                    this_.$("#waiting").slideDown();
                });
            }
        }

		this.$(".modelist li").click(function (e) {
			// Which one has been selected?
			var $button = $(e.currentTarget),
				mode = $button.index();

			$button.addClass("sel")
				.siblings().removeClass("sel");

	        if (mode !== 3) {
	            this_.$("#privatelobby").slideUp();
	        }
            switch (mode) {
            case 0: selectGameType("looking_for_any", "quick play"); break;
            case 1: selectGameType("looking_for_2", "2 player game"); break;
            case 2: selectGameType("looking_for_4", "4 player game"); break;
            case 3: selectGameType("private"); break;
            }
		});

        var game = undefined;
        var $startButton = this.$("#privatelobby #start");

        function selectPrivateGameType (type) {
            var dfd;
            if (type == 2) {
                dfd = blokus.userProfile.save({ status: "private_2" }, options);
            } else {
                dfd = blokus.userProfile.save({ status: "private_4" }, options);
            }
            dfd.then(function () {
                this_.$("#privatelobby .error").remove();
                game = new blokus.Game({ id: blokus.userProfile.get("gameid") });
                game.fetch({ success: function () {
                    this_.$("#privatelobby .p" + type).addClass("sel").siblings().removeClass("sel");
                    this_.$("#privatelobby .details").slideDown();
                    this_.$("#privatelobby #start").show();
                    pollGame();
                }, error: function () {
                    blokus.showError("Unable to fetch game");
                }});
            }).fail(function () {
                blokus.showError("Unable to fetch user profile");
            });
        }

        function pollGame() {
            game.fetch({ success: function () {
                if (game.players.length === 4) {
                    $startButton.removeClass("disabled");
                } else {
                    $startButton.addClass("disabled");
                }
            }})
        }

        this.$("#privatelobby .p2").click(function () { selectPrivateGameType(2); });
        this.$("#privatelobby .p4").click(function () { selectPrivateGameType(4); });

        this.$("#privatelobby #cancel, #waiting #cancel").click(function () {
            blokus.userProfile.save({ status: "offline" });
            this_.pollUser = false;
            this_.$("#privatelobby, #waiting").slideUp(200).promise().done(function () {
                this_.$(".modelist").slideDown();
            });
        });


        $startButton.click(function () {
            if (!$startButton.hasClass("disabled")) {
                console.log("YYYY")
            }
        });

		return this;
	}
});