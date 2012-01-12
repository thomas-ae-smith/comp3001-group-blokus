blokus.LobbyView = Backbone.View.extend({
    pollUser: false,
    dict: { error: function () { blokus.showError("Failed to save user profile"); } },

    initialize: function () {
        var this_ = this,
            poller = setInterval(function () { // Fetch user model every second (to determined if user is yet in a game)
                if (this_.pollUser) { blokus.userProfile.fetch(); }
            }, 4000);
        blokus.userProfile.bind("change:game_id", function (up, game_id) {
            blokus.router.navigate("game/" + game_id, true);
        });


        this.bind("close", function () { clearTimeout(poller); }); // Remove poller timeout when lobbyview is closed
    },


    selectGameType: function (type, title, private_hash) {
        var this_ = this;
        if (type == "private") {
            if (private_hash == null) {
                blokus.userProfile.save({ status: "offline" }, this_.dict);
            } else {
                $("#privatelobby div .playerchoices").hide();
                $("#privatelobby div > p").hide();
                dfd = blokus.userProfile.save({ status: 'private', private_hash: private_hash },{ success: function () {
                    blokus.userProfile.fetch({success: function() {
                        if(blokus.userProfile.get('private_hash') == null) {
                            blokus.showMsg("The private game no longer exists or is full.");   
                        } else {
                            this_.selectPrivateGameType(blokus.userProfile.get('status'));   
                        }   
                    }});           
                }, error: function () {
                    blokus.showError("Failed to set userprofile hash");  
                }}); 
            }
            
            this_.pollUser = false;
            this_.$(".modelist").slideUp(200, function () { // Slide up
                this_.$("#privatelobby").slideDown();
            });
        } else {
            blokus.userProfile.save({ status: type }, this_.dict);;
            this_.pollUser = true;
            this_.$(".modelist").slideUp(200, function () {
                this_.$("#waiting .title").html(title)
                this_.$("#waiting").slideDown();
            });
        }
    },

    selectPrivateGameType: function (type) {
        $("#privatelobby div .playerchoices").hide();
        $("#privatelobby div > p").hide();
        var this_ = this;
        var dfd = new  $.Deferred(); 

        blokus.userProfile.save({ status: type }).then(function() {
            blokus.userProfile.fetch().then(function() {
                dfd.resolve();
            });  
        });

        dfd.then(function () {
            this_.pollUser = true;
            this_.$("#gameurl").val("http://"+window.location.hostname+":"+window.location.port+"/#lobby/"+blokus.userProfile.get('private_hash'));
            this_.$("#privatelobby .p" + type).addClass("sel").siblings().removeClass("sel");
            this_.$("#privatelobby .details").slideDown();
            this_.$("#privatelobby #start").show();
        }).fail(function () {
            blokus.showError("Unable to fetch user profile");
        }); 
    },


	render: function () {
		var this_ = this,
			template = blokus.getTemplate("lobby"),
            options = { error: function () { blokus.showError("Failed to save user profile"); } };

		function renderTemplate () {
			var name = blokus.user.get("username");
			var userProfile = blokus.user.get("userprofile");
			var isGuest = userProfile.is_guest
			$(this_.el).html(template({
				picsrc: blokus.userProfile.get("profile_image_url"),
				name: name,
				stats: isGuest ? "Please login to save your scores" : "wins: " + userProfile.wins.toString() + " losses: " + userProfile.losses.toString(),
				hideSignOut: isGuest ? "" : "style=\"display:none;\"",
				hideProfile: isGuest ? "style=\"display:none;\"" : ""
			}));
		}
        

        renderTemplate();
		this.$("#loginForm").submit(function(event) {
			event.preventDefault();
			var $form = $(this);
			$.post( $form.attr('action'), $form.serialize(), function(data) {
				if (data == "true") {
					blokus.getCurrentUser(function() {
						renderTemplate();
					});
				} else {
					blokus.showError(data);
				}
			}).error(function() { blokus.showError("Failed to login"); });
		});

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
            case 0: this_.selectGameType("looking_for_any", "quick play"); break;
            case 1: this_.selectGameType("looking_for_2", "2 player game"); break;
            case 2: this_.selectGameType("looking_for_4", "4 player game"); break;
            case 3: this_.selectGameType("private"); break;
            }
		});

        var game = undefined;
        var $startButton = this.$("#privatelobby #start");


        this.$("#privatelobby .p2").click(function () { this_.selectPrivateGameType("private_2"); });
        this.$("#privatelobby .p4").click(function () { this_.selectPrivateGameType("private_4"); });

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

        var other_users_change = function(up, other_user) {
            alert($(".players").length);
            $(".players div[data-online=\"false\"] .online .name").html(other_user)
        }

        blokus.userProfile.bind("change:private_user_0", other_users_change)
        blokus.userProfile.bind("change:private_user_1", other_users_change)
        blokus.userProfile.bind("change:private_user_2", other_users_change)
        other_users_change(blokus.userProfile,blokus.userProfile.get('private_user_0'));

		return this;
	}
});
