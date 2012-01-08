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
		player_set = bundle.obj.user.player_set.all()
		if len(player_set) > 0:
			bundle.data['game_id'] = player_set[0].game
		else:
			bundle.data['game_id'] = None
		return bundle

	def get_object_list(self, request):
		if request and request.user.id is not None:
			userProfiles = super(UserProfileResource, self).get_object_list(request)
			userProfiles.exclude(id=request.user.id)
			users_playing = [request.user]
			# Game Attributes: <status>:(<typeID>,<playerCount>)
			# Must be added to if a new game type is introduced.
			game_attributes = {
				'looking_for_2':(1,2),
				'looking_for_4':(2,4),
				'private_2':(1,2),
				'private_4':(2,4),
			}

			# Get a list of users to play in a game.
			statuses = set(['looking_for_2','looking_for_4'])
			if request.user.get_profile().status == 'looking_for_any':
				random.shuffle(statuses)
				for status in statuses:
					for userProfile in userProfiles:
						if userProfile.status in [status, 'looking_for_any']:
							users_playing.append(userProfile.user)
							if len(users_playing) >= game_attributes[request.user.get_profile().status][1]:
								break
					if len(users_playing) >= game_attributes[request.user.get_profile().status][1]:
						request.user.get_profile().status = status
						break
			elif request.user.get_profile().status in statuses:
				for userProfile in userProfiles:
					if userProfile.status in [request.user.get_profile().status, 'looking_for_any']:
						users_playing.append(userProfile.user)
					if len(users_playing) >= game_attributes[request.user.get_profile().status][1]:
						break
			elif request.user.get_profile().status[0:7] == "private":
				for userProfile in UserProfiles:
					if (userProfile.status == request.user.get_profile().status and
						userProfile.private_queue == request.user.private_queue):
						users_playing.append(userProfile.user)
					if len(users_playing) >= game_attributes[request.user.get_profile().status][1]:
						break
				request.user.get_profile().status = {'private_2':'looking_for_2', 'private_4':'looking_for_4'}[request.user.get_profile().status]
			else:
				# If the users status is not one that required joining a game,
				# return the UserModels without setting up any games.
				return userProfiles

			if len(users_playing) >= game_attributes[request.user.get_profile().status][0]:
				colours = ['blue', 'yellow', 'red', 'green']
				game = Game(game_type=game_attributes[request.user.get_profile().status][0])
				for user_number in xrange(4):
					user = None
					if request.user.get_profile().status == 'looking_for_2':	# Will need to add to this IF
						user = users_playing[user_number % 2]	# block if any new game types
					else:										# are added.
						user = users_playing[user_number]
					user.status = 'ingame'
					player = Player(
						game=game,
						user=user,
						colour=colours[user_number])
					user.save()
					player.save()
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

	def dehydrate(self, bundle):
		bundle['time_now'] = datetime.now()
		return bundle

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

	def piece_str_to_json(self, piece_str):
		piece_data = []
		for row in piece_str.split(','):
			piece_data.append(list(row))
		return [map(int, x) for x in piece_data]

	def piece_json_to_str(self, piece_json):
		piece_data = [map(str, x) for x in piece_json]
		piece_data_string = ''
		for row in piece_data:
			piece_data_string += ''.join(row) + ','
		return piece_data_string[:-1]

	def to_json(self, data, options=None):
		options = options or {}
		data = self.to_simple(data, options)

		if data.get('objects') is not None:
			for i, piece in enumerate(data.get('objects')):
				data['objects'][i]['piece_data'] = self.piece_str_to_json(piece['piece_data'])
		else:
			data['piece_data'] = self.piece_str_to_json(data['piece_data'])

		return simplejson.dumps(data, cls=json.DjangoJSONEncoder, sort_keys=True)

	def from_json(self, content):
		data = simplejson.loads(content)

		if data.get('objects') is not None:
			for i, piece in enumerate(data.get('objects')):
				data['objects'][i]['piece_data'] = self.piece_json_to_str(piece['piece_data'])
		else:
			data['piece_data'] = self.piece_json_to_str(data['piece_data'])

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
