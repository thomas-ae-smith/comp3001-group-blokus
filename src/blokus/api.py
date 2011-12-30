from django.contrib.auth.models import User
from blokus.models import *
from tastypie import fields
from tastypie.resources import ModelResource
from tastypie.authorization import Authorization
from tastypie.validation import CleanedDataFormValidation
from django.forms import ModelForm, ValidationError
from django.core import serializers
from datetime import datetime
import random

class UserResource(ModelResource):
	userprofile = fields.ToOneField('blokus.api.UserProfileResource', 'userprofile', full=True)

	class Meta:
		queryset = User.objects.all()
		resource_name = 'user'
		default_format = 'application/json'
		excludes = ['password', 'is_staff', 'is_superuser']
		list_allowed_methods = ['get']
		detail_allowed_methods = ['get']
		authorization = Authorization()

class UserProfileResource(ModelResource):
	user = fields.ForeignKey(UserResource, 'user')

	class Meta:
		queryset = UserProfile.objects.all()
		resource_name = 'userprofile'
		default_format = 'application/json'
		list_allowed_methods = []
		detail_allowed_methods = ['get','put']
		authorization = Authorization()

	def get_object_list(self, request):
		if request and request.user.id is not None:
			request.user.last_activity = datetime.now() #User is active.
			userProfiles = super(GameResource, self).get_object_list(request)
			users_playing = set(request.user)
			player_count = {
				'looking_for_2':2,
				'looking_for_4':4,
			}

			# Get a list of users to play in a game.
			if request.user.status == 'looking_for_any':
				statuses = player_count.keys()
				random.shuffle(statuses)
				for status in statuses:
					users_playing = set(request.user)
					for user in userProfiles:
						if user.status in [status, 'looking_for_any']:
							users_playing.add(user)
							if users_playing.size >= player_count[request.user.status]:
								break
					if users_playing.size >= player_count[request.user.status]:
						request.user.status = status
						break
			elif request.user.status in statuses:
				for user in userProfiles:
					if user.status in [request.user.status, 'looking_for_any']:
						users_playing.add(user)
					if users_playing.size >= player_count[request.user.status]:
						break
			else:
				# If the users status is not one that required joining a game,
				# return the UserModels without setting up any games.
				return userProfiles

			colours = ['red', 'yellow', 'green', 'blue']
			if users_playing.size >= player_count[request.user.status]:
				game = Game()
				game.start_time = datetime.now()
				game.game_type = {		# Game codes; must be added
					'looking_for_2':0,	# to if any new game types
					'looking_for_4':1,	# are introduced.
				}[request.user.status]
				for user_number in xrange(4):
					user = users_playing.pop()
					user.status = 'ingame'
					player = Player(
						game=game,
						user=user,
						colour=colours[user_number])
					player.save()
					user.save()
				game.save()
			return userProfiles
		return UserProfile.objects.none()

class GameAuthorization(Authorization):

	#Limits return set so only games are shown that current user is playing in.
	def apply_limits(self, request, object_list):
		if request and request.user.id is not None:
			result = []
			for game in object_list:
				if(game.player_set.filter(user=request.user).count() > 0):
					result.append(game)
			return result
		return object_list.none()

class GameResource(ModelResource):
	players = fields.ToManyField('blokus.api.PlayerResource', 'player_set', full=True)
	class Meta:
		queryset = Game.objects.all()
		resource_name = 'game'
		default_format = 'application/json'
		list_allowed_methods = []
		detail_allowed_methods = ['get']
		authorization = GameAuthorization()

	#Every time a user gets a game object of theirs, their player timestamp is updated.
	def get_object_list(self, request):
		if request and request.user.id is not None:
			games = super(GameResource, self).get_object_list(request)
			for game in games:
				user = Player.objects.get(game=game,user=request.user).user
				user.last_activity = datetime.now()
				user.save()
			return games
		return Game.objects.none()

class PlayerResource(ModelResource):
	user = fields.ForeignKey(UserResource, 'user')
	game = fields.ForeignKey(GameResource, 'game')
	pieces = fields.ToManyField('blokus.api.PieceResource', 'piece_set', full=True)

	class Meta:
		queryset = Player.objects.all()
		resource_name = 'player'
		default_format = 'application/json'
		list_allowed_methods = []
		detail_allowed_methods = ['get','put']
		authorization = Authorization()


class PieceMasterResource(ModelResource):
	class Meta:
		queryset = PieceMaster.objects.all()
		resource_name = 'piecemaster'
		default_format = 'application/json'
		allowed_methods = ['get']
		authorization = Authorization()

class PieceForm(ModelForm):
	class Meta:
		model = Piece

	def clean(self):
		cleaned_data = self.cleaned_data
		piece = self.save(commit=False)
		if not piece.is_valid_position():
			raise ValidationError("Not a valid move")
		return cleaned_data

class PieceResource(ModelResource):
	master = fields.ForeignKey(PieceMasterResource, 'master')
	player = fields.ForeignKey(PlayerResource, 'player')

	class Meta:
		queryset = Piece.objects.all()
		resource_name = 'piece'
		default_format = 'application/json'
		list_allowed_methods = ['get']
		detail_allowed_methods = ['get','post']
		validation = CleanedDataFormValidation(form_class=PieceForm)
		authorization = Authorization()
