from django.contrib.auth.models import User
from blokus.models import *
from tastypie import fields
from tastypie.resources import ModelResource
from tastypie.authorization import Authorization
from tastypie.validation import CleanedDataFormValidation
from django.forms import ModelForm, ValidationError
from django.core import serializers


class PieceMasterResource(ModelResource):
	class Meta:
		queryset = PieceMaster.objects.all()
		resource_name = 'piecemaster'
		allowed_methods = ['get']
		authorization = Authorization()

class UserResource(ModelResource):
	class Meta:
		queryset = User.objects.all()
		resource_name = 'user'
		excludes = ['password', 'is_staff', 'is_superuser']
		allowed_methods = ['get','put']
		authorization = Authorization()


class GameResource(ModelResource):
	players = fields.ToManyField('blokus.api.PlayerResource', 'player_set', full=True)
	class Meta:
		queryset = Game.objects.all()
		resource_name = 'game'
		allowed_methods = ['get']
		authorization = Authorization()



class PlayerResource(ModelResource):
	game = fields.ForeignKey(GameResource, 'game')
	pieces = fields.ToManyField('blokus.api.PieceResource', 'piece_set', full=True)
	
	class Meta:
		queryset = Player.objects.all()
		resource_name = 'player'
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
	player = fields.ForeignKey(PlayerResource, 'player')

	class Meta:
		queryset = Piece.objects.all()
		resource_name = 'piece'
		allowed_methods = ['get']
		validation = CleanedDataFormValidation(form_class=PieceForm)
		authorization = Authorization()




