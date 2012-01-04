from django.contrib.auth.models import User
from blokus.models import *
from tastypie import fields
from tastypie.resources import ModelResource
from tastypie.authorization import Authorization
from tastypie.validation import CleanedDataFormValidation
from tastypie.serializers import Serializer
from django.forms import ModelForm, ValidationError
from django.core.serializers import json
from django.utils import simplejson
from datetime import datetime
import logging
import random

class UserResource(ModelResource):
	userprofile = fields.ToOneField('blokus.api.UserProfileResource', 'userprofile', full=True)

	class Meta:
		queryset = User.objects.all()
		resource_name = 'user'
		default_format = 'application/json'
		excludes = ['password', 'is_staff', 'is_superuser']
		list_allowed_methods = []
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

	def dehydrate(self, bundle):
		player_set = user.player_set.all()
		if len(player_set) > 0:
			bundle.data['game_id'] = player_set[0]
		else:
			bundle.data['game_id'] = None
		return bundle

	def get_object_list(self, request):
		if request and request.user.id is not None:
			#request.user.last_activity = datetime.now() #User is active.
			userProfiles = super(GameResource, self).get_object_list(request)
			users_playing = set(request.user)
			# Game Attributes: <status>:(<typeID>,<playerNum>)
			# Must be added to if a new game type is introduced.
			game_attributes = {
				'looking_for_2':(1,2),
				'looking_for_4':(2,4),
			}

			# Get a list of users to play in a game.
			if request.user.status == 'looking_for_any':
				statuses = game_attributes.keys()
				random.shuffle(statuses)
				for status in statuses:
					users_playing = [request.user]
					for user in userProfiles:
						if user.status in [status, 'looking_for_any']:
							users_playing.append(user)
							if len(users_playing) >= game_attributes[request.user.status][1]:
								break
					if len(users_playing) >= game_attributes[request.user.status][1]:
						request.user.status = status
						break
			elif request.user.status in statuses:
				for user in userProfiles:
					if user.status in [request.user.status, 'looking_for_any']:
						users_playing.append(user)
					if len(users_playing) >= player_count[request.user.status][1]:
						break
			else:
				# If the users status is not one that required joining a game,
				# return the UserModels without setting up any games.
				return userProfiles

			if len(users_playing) >= game_attributes[request.user.status][0]:
				colours = ['red', 'yellow', 'green', 'blue']
				game = Game()
				game.start_time = datetime.now()
				game.game_type = game_attributes[request.user.status][0]
				for user_number in xrange(4):
					user = None
					if request.user.status == 'looking_for_2':	# Will need to add to this IF
						user = users_playing[user_number % 2]	# block if any new game types
					else:										# are added.
						user = users_playing[user_number]
					user.status = 'ingame'
					player = Player(
						game=game,
						user=user,
						colour=colours[user_number])
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
				player = Player.objects.get(game=game,user=request.user)
				player.last_activity = datetime.now()
				player.save()
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

#This allows the client to recieve/send piece data in json array format rarther than the 01 DB format.
#Coversion is done here.
class PieceJSONSerializer(Serializer):
	def to_json(self, data, options=None):
		options = options or {}
		data = self.to_simple(data, options)

		piece_data = []
		for row in data['piece_data'].split(','):
			piece_data.append(list(row))
		piece_data  = [map(int, x) for x in piece_data]

		data['piece_data'] = piece_data

		return simplejson.dumps(data, cls=json.DjangoJSONEncoder, sort_keys=True)

	def from_json(self, content):
		data = simplejson.loads(content)

		piece_data = [map(str, x) for x in data['piece_data']]
		piece_data_string = ''
		for row in piece_data:
			piece_data_string += ''.join(row) + ','

		data['piece_data'] = piece_data_string[:-1]

		return data

class PieceMasterResource(ModelResource):
	class Meta:
		queryset = PieceMaster.objects.all()
		resource_name = 'piecemaster'
		default_format = 'application/json'
		allowed_methods = ['get']
		authorization = Authorization()
		serializer = PieceJSONSerializer()

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
