from django.contrib.auth.models import User
from blokus.models import *
from tastypie import fields
from tastypie.resources import ModelResource
from tastypie.authorization import Authorization
from tastypie.validation import CleanedDataFormValidation
from django.forms import ModelForm, ValidationError
from django.core import serializers

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



class GameResource(ModelResource):
	players = fields.ToManyField('blokus.api.PlayerResource', 'player_set', full=True)
	class Meta:
		queryset = Game.objects.all()
		resource_name = 'game'
		default_format = 'application/json'
		list_allowed_methods = []
		detail_allowed_methods = ['get']
		authorization = Authorization()



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
	piecemaster = fields.ForeignKey(PieceMasterResource, 'piecemaster')
	player = fields.ForeignKey(PlayerResource, 'player')

	class Meta:
		queryset = Piece.objects.all()
		resource_name = 'piece'
		default_format = 'application/json'
		list_allowed_methods = ['get']
		detail_allowed_methods = ['get','post']
		validation = CleanedDataFormValidation(form_class=PieceForm)
		authorization = Authorization()




