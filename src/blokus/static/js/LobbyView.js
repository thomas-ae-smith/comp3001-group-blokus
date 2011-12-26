blokus.LobbyView = Backbone.View.extend({
    pollUser: false,

    initialize: function () {
        var this_ = this;

        // Fetch user model every second (to determined if user is yet in a game)
        var poller = setInterval(function () {
            if (this_.pollUser) { blokus.user.fetch(); }
        }, 1000);

        // Remove poller timeout when lobbyview is closed
        this.bind("close", function () { clearTimeout(poller); });

        blokus.userProfile.bind("change:gameId", function (user, gameId) {
            if (gameUri) {
                blokus.game = new GameModel({ id: gameId });
                blokus.game.fetch();
                blokus.router.navigate("game/" + id, true);
            } else {
                blokus.game = undefined;
            }
        });
    },

	render: function () {
		var this_ = this,
			template = _.template($('#lobby-template').html());

		$(this.el).html(template());

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
            case 0:
                blokus.userProfile.save({ status: "looking_for_any" });
                this_.pollUser = true;
                break;
            case 1:
                blokus.userProfile.save({ status: "looking_for_2" });
                this_.pollUser = true;
                break;
            case 2:
                blokus.userProfile.save({ status: "looking_for_4" });
                this_.pollUser = true;
                break;
            case 3:
                blokus.userProfile.save({ status: "private" });
                this_.pollUser = false;
                this_.$("#privatelobby").slideDown();
                break;
            }

		});

		return this;
	}
});