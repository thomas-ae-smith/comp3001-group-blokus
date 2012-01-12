from django.contrib.auth.models import User
from blokus.models import *
from tastypie import fields
from tastypie.resources import ModelResource
from tastypie.authorization import Authorization
from tastypie.validation import CleanedDataFormValidation, Validation
from tastypie.serializers import Serializer
from django.forms import ModelForm, ValidationError
from django.core.serializers import json
from django.utils import simplejson
from datetime import datetime, timedelta
from guest.utils import display_username
import logging
import random
import md5

#Can only view own user/userprofile object and others you are playing with
class AccountAuthorization(Authorization):
	def apply_limits(self, request, object_list, user_or_userprofile='user'):
		if request and request.user.id is not None:

			result = []

			#If putting then can only do so on own account
			if request.method != 'GET':
				for user in object_list:
					if user_or_userprofile == 'user' and user.id == request.user.id:
						result.append(user)
					elif user_or_userprofile == 'userprofile' and user.user.id == request.user.id:
						result.append(user)
				return result

			#If getting then can also see other players your with
			players_attached = request.user.player_set.all()
			ingame = len(players_attached) > 0
			if ingame:
				player_user_list = players_attached[0].game.player_set.all().values_list('user',flat=True)

			for user in object_list:
				if user_or_userprofile == 'user' and ((user.id == request.user.id) or (ingame and user.id in player_user_list)):
					result.append(user)
				elif user_or_userprofile == 'userprofile' and ((user.id == request.user.get_profile().id) or (ingame and user.user.id in player_user_list)):
					result.append(user)

			return result
		return object_list.none()


class UserAuthorization(AccountAuthorization):
	def apply_limits(self, request, object_list):
		return super(UserAuthorization, self).apply_limits(request, object_list)

class UserResource(ModelResource):
	userprofile = fields.ToOneField('blokus.api.UserProfileResource', 'userprofile', full=True)

	class Meta:
		queryset = User.objects.all()
		resource_name = 'user'
		default_format = 'application/json'
		excludes = ['password', 'is_staff', 'is_superuser']
		list_allowed_methods = []
		detail_allowed_methods = ['get']
		authorization = UserAuthorization()

	def obj_get(self, request=None, **kwargs):
		user = super(UserResource, self).obj_get(request, **kwargs)
		user.username = display_username(user)
		return user

	#Dont show emails to others
	def dehydrate(self, bundle):
		if str(bundle.request.user.id) != bundle.data['id']:
			del bundle.data['email']
			del bundle.data['idxf_email_l_iexact']
		return bundle

class UserProfileAuthorization(AccountAuthorization):
	def apply_limits(self, request, object_list):
		return super(UserProfileAuthorization, self).apply_limits(request, object_list, user_or_userprofile='userprofile')

class UserProfileResource(ModelResource):
	user = fields.ForeignKey(UserResource, 'user')

	class Meta:
		queryset = UserProfile.objects.all()
		resource_name = 'userprofile'
		default_format = 'application/json'
		list_allowed_methods = []
		detail_allowed_methods = ['get','put']
		authorization = UserProfileAuthorization()

	def dehydrate(self, bundle):
		player_set = bundle.obj.user.player_set.all()
		if len(player_set) > 0:
			bundle.data['game_id'] = player_set.all()[0].game.id
		else:
			bundle.data['game_id'] = None

		return bundle

	def apply_authorization_limits(self, request, object_list):
		object_list = super(UserProfileResource, self).apply_authorization_limits(request, object_list)
		current_userprofile = object_list[0]
		status = current_userprofile.status

		#If setting status or not polling own profiles we dont try and make matches
		if status in ['offline','ingame'] or request.method != 'GET' or request.user.id != current_userprofile.user.id:
			return object_list


		# Game Attributes: <status>:(<typeID>,<playerCount>)
		# Must be added to if a new game type is introduced.
		game_attributes = {
			'looking_for_2': {'typeid':1, 'player_count':2},
			'looking_for_4': {'typeid':2, 'player_count':4},
			'private_2': {'typeid':1, 'player_count':2},
			'private_4': {'typeid':2, 'player_count':4},
		}

		if status == 'looking_for_any':
			status = ['looking_for_2','looking_for_4'][random.randint(0,1)]

		#Possible set of users to match against
		if status[:7] == 'private':
			if current_userprofile.private_hash is None:
				m = md5.new()
				m.update(str(current_userprofile.id))
				current_userprofile.private_hash = m.hexdigest()
			possible_users = UserProfile.objects.filter(status=status,private_hash=current_userprofile.private_hash).exclude(id=current_userprofile.id)
		else:
			possible_users = UserProfile.objects.filter(status=status).exclude(id=current_userprofile.id)

		if len(possible_users) < game_attributes[status]['player_count'] - 1:
			return object_list

		current_userprofile.status = status
		current_userprofile.save()

		#Users to play include yourself
		users_playing = [request.user]

		for possible_user in possible_users:
			users_playing.append(possible_user.user)
			if len(users_playing) >= game_attributes[status]['player_count']:
				break

		#Create game
		game = Game(game_type=game_attributes[status]['typeid'])
		game.save()

		#For each player set status to ingame and create their player object
		colours = ['blue', 'yellow', 'red', 'green']
		k = 0
		for i, user_playing in enumerate(users_playing):
			user_playing_profile = user_playing.get_profile()
			user_playing_profile.status = 'ingame'
			object_list[0].status = 'ingame'
			user_playing_profile.save()
			for j in xrange(1 if game_attributes[status]['typeid'] == 2 else 2):
				player = Player(game=game,user=user_playing,colour=colours[k])
				player.save()
				k += 1

		#Return the requested userProfiles object list
		return object_list

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
		state = bundle.request.GET.get('state')
		if state is None:
			state = 0

		# Return the current server-time of the game.
		bundle.data['time_now'] = datetime.now()

		new_piece_ids = Move.objects.filter(game=Game.objects.get(pk=bundle.data['id']),move_number__gt=state).values_list('piece', flat=True)
		for i, player in enumerate(bundle.data['players']):
			for j, piece in enumerate(player.data['pieces']):
				if long(piece.data['id']) not in new_piece_ids:
					del bundle.data['players'][i].data['pieces'][j]
		return bundle

	#Every time a user gets a game object of theirs, their player timestamp is updated.
	def get_object_list(self, request):
		if request and request.user.id is not None:
			games = super(GameResource, self).get_object_list(request)
			player = request.user.player_set.all()[0]
			game = player.game
			player.last_activity = datetime.now()
			player.save()

			# If a player does not fetch a game model for 60 seconds, they are
			# considered disconnected.
			"""for otherPlayer in Player.objects.filter(game=game):
				if (datetime.now() - otherPlayer.last_activity).seconds > 60:
					import sys
					print >>sys.stderr, "THERE HAS BEEN NO RESPONSE FROM THE USER " + str(otherPlayer.user.id) + " FOR " + str((datetime.now() - otherPlayer.last_activity).seconds) + " SECONDS!"
					otherPlayer.user.get_profile().status = 'offline'
					otherPlayer.save()"""
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
		detail_allowed_methods = []
		authorization = Authorization()

	def dehydrate(self, bundle):
		bundle.data['can_move'] = bundle.obj.is_able_to_move() #TODO IT DOES NOT WORK IndexError: list assignment index out of range in get_grid
		return bundle

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

class PieceValidation(Validation):
    def is_valid(self, bundle, request=None):
        if not bundle.data:
            return {'__all__': 'Not quite what I had in mind.'}
        return {}

#This allows the client to recieve/send piece data in json array format rarther than the 01 DB format.
#Coversion is done here.
class PieceJSONSerializer(Serializer):
	# Mapping between the way the orientation is stored on the server (rot and
	# trans), and the way it is stored at the client (rot, v-flip and h-flip).
	# (<rot>, <trans>):(<rot>, <flip>)
	server_client_mapping = {
		(0,False):(0,0),
		(1,False):(1,0),
		(2,False):(2,0),
		(3,False):(3,0),
		(0,True):(3,1),
		(1,True):(2,1),
		(2,True):(1,1),
		(3,True):(0,1)
	}

	def get_client_flip(self, rotation, flip):
		return self.server_client_mapping[(rotation,flip)][1]

	def get_client_rotation(self, rotation, flip):
		return self.server_client_mapping[(rotation,flip)][0]

	def get_server_flip(self, rotation, flip):
		client_server_mapping = dict((v,k) for k, v in self.server_client_mapping.iteritems())
		return client_server_mapping[(rotation,flip)][1]

	def get_server_rotation(self, rotation, flip):
		client_server_mapping = dict((v,k) for k, v in self.server_client_mapping.iteritems())
		return client_server_mapping[(rotation,flip)][0]

	def to_json(self, data, options=None):
		options = options or {}
		data = self.to_simple(data, options)
		if data.get('objects') is not None:
			for i, piece in enumerate(data.get('objects')):
				data['objects'][i]['flip'] = self.get_client_flip(data['objects'][i]['rotation'], data['objects'][i]['flip'])
				data['objects'][i]['rotation'] = self.get_client_rotation(data['objects'][i]['rotation'], data['objects'][i]['flip'])
		else:
			data['flip'] = self.get_client_flip(data['rotation'], data['flip'])
			data['rotation'] = self.get_client_rotation(data['rotation'], data['flip'])

		return simplejson.dumps(data, cls=json.DjangoJSONEncoder, sort_keys=True)

	def from_json(self, content):
		data = simplejson.loads(content)
		if data.get('objects') is not None:
			for i, piece in enumerate(data.get('objects')):
				data['objects'][i]['flip'] = self.get_server_flip(data['objects'][i]['rotation'], data['objects'][i]['flip'])
				data['objects'][i]['rotation'] = self.get_server_rotation(data['objects'][i]['rotation'], data['objects'][i]['flip'])
		else:
			data['flip'] = self.get_server_flip(data['rotation'], data['flip'])
			data['rotation'] = self.get_server_rotation(data['rotation'], data['flip'])

		return data


class PieceResource(ModelResource):
	master = fields.ForeignKey(PieceMasterResource, 'master')
	player = fields.ForeignKey(PlayerResource, 'player')

	server_client_mapping = {
		(0,False):(0,0),
		(1,False):(1,0),
		(2,False):(2,0),
		(3,False):(3,0),
		(0,True):(3,1),
		(1,True):(2,1),
		(2,True):(1,1),
		(3,True):(0,1)
	}

	class Meta:
		queryset = Piece.objects.all()
		resource_name = 'piece'
		default_format = 'application/json'
		list_allowed_methods = ['post']
		detail_allowed_methods = []
		validation = PieceValidation()
		authorization = Authorization()
		#serializer = PieceJSONSerializer()

	def get_client_flip(self, rotation, flip):
		return self.server_client_mapping[(rotation,flip)][1]

	def get_client_rotation(self, rotation, flip):
		return self.server_client_mapping[(rotation,flip)][0]

	def get_server_flip(self, rotation, flip):
		client_server_mapping = dict((v,k) for k, v in self.server_client_mapping.iteritems())
		return client_server_mapping[(rotation,flip)][1]

	def get_server_rotation(self, rotation, flip):
		client_server_mapping = dict((v,k) for k, v in self.server_client_mapping.iteritems())
		return client_server_mapping[(rotation,flip)][0]

	def dehydrate(self, bundle):
		if 'flip' in bundle.data:
			bundle.data['rotation'] = self.get_client_rotation(bundle.data['rotation'], bundle.data['flip']) #TODO 'flip' does not exists so it needs to be fixed
			bundle.data['flip'] = self.get_client_flip(bundle.data['rotation'], bundle.data['flip'])
		else:
			bundle.data['rotation'] = 0
			bundle.data['flip'] = 0
		return bundle

	def hydrate(self, bundle):
		from blokus.models import PieceMaster, Player
		user = bundle.request.user
		bundle.obj.master = PieceMaster.objects.get(id=bundle.data['master'].split('/')[-2])    #HACK HACK HACK!!! Client returns master **ID**
		bundle.obj.player = Player.objects.filter(user = user)[0]
		bundle.data['rotation'] = self.get_server_rotation(bundle.data['rotation'], bundle.data['flip'])
		bundle.data['flip'] = self.get_server_flip(bundle.data['rotation'], bundle.data['flip'])
		return bundle
