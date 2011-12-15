from django.contrib.auth.models import User
from blokus.models import *
from tastypie import fields
from tastypie.resources import ModelResource
from tastypie.authorization import Authorization
from tastypie.validation import CleanedDataFormValidation
from django.forms import ModelForm, ValidationError

class UserResource(ModelResource):
	class Meta:
		queryset = User.objects.all()
		resource_name = 'user'
		excludes = ['password', 'is_staff', 'is_superuser']
		allowed_methods = ['get','put']
		authorization = Authorization()

	def dispatch(self, request_type, request, **kwargs):
		print kwargs
		kwargs['pieces'] = PieceMaster.objects.all()
		return super(UserResource, self).dispatch(request_type, request, **kwargs)


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
	class Meta:
		queryset = Piece.objects.all()
		resource_name = 'piece'
		allowed_methods = ['get']
		validation = CleanedDataFormValidation(form_class=PieceForm)

class PlayerResource(ModelResource):
	class Meta:
		queryset = Player.objects.all()
		resource_name = 'player'
		allowed_methods = ['get']



