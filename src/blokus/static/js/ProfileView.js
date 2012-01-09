blokus.ProfileView = Backbone.View.extend({
	render: function () {
		var this_ = this,
			template = _.template($('#profile-template').html());
		var userProfile = blokus.user.get("userprofile");
		var dateJoined = new Date(blokus.user.get("date_joined"));
		var dateText = dateJoined.getDate() + "/" + (dateJoined.getMonth()+1) + "/" + dateJoined.getFullYear() + " " + dateJoined.getHours() + ":" + dateJoined.getMinutes();
		$(this.el).html(template({
			username: blokus.user.get("username"),
			joined: dateText,
			wins: userProfile.wins.toString(),
			losses: userProfile.losses.toString()
		}));
		return this;
	}
});