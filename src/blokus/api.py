from django.contrib.auth.models import User
from blokus.models import *
from tastypie import fields
from tastypie.resources import ModelResource
from tastypie.authorization import Authorization

class UserResource(ModelResource):
	class Meta:
		queryset = User.objects.all()
		resource_name = 'user'
		excludes = ['password', 'is_staff', 'is_superuser']
		allowed_methods = ['get','put']
		authorization = Authorization()

class GameResource(ModelResource):
	class Meta:
		queryset = Game.objects.all()
		resource_name = 'game'
		allowed_methods = ['get']

class PieceMasterResource(ModelResource):
	class Meta:
		queryset = PieceMaster.objects.all()
		resource_name = 'piecemaster'
		allowed_methods = ['get']

class PieceResource(ModelResource):
	class Meta:
		queryset = Piece.objects.all()
		resource_name = 'piece'
		allowed_methods = ['get']

class PlayerResource(ModelResource):
	class Meta:
		queryset = Player.objects.all()
		resource_name = 'player'
		allowed_methods = ['get']



