from django.shortcuts import render_to_response
from blokus.api import UserResource
from django.http import HttpResponse, HttpResponseNotFound, HttpResponseBadRequest
from django.views.decorators.http import require_http_methods
from django.contrib.auth import authenticate, login, logout
from django import forms
from django.template import RequestContext
from datetime import timedelta, datetime
from blokus.models import *

from guest.decorators import guest_allowed

# Garbage collection function called by cronjob.
def execute_garbage_collection(request):
	# The amount of time which a single player may be disconnected for before the game is garbage-collected.
	TIMEOUT_IN_SECONDS = 60 * 15

	# If any game contains a player who has not been seen online in TIMEOUT_IN_SECONDS,
	# delete the game and all its players.
	removed_game_ids = []
	removed_player_ids = []
	for game in Game.objects.all():
		for player in game.player_set.all():
			if (datetime.now() - player.last_activity).seconds > TIMEOUT_IN_SECONDS:
				for player_dead in game.player_set.all():
					removed_player_ids.append(player_dead.id)
					player_dead.delete()
				removed_game_ids.append(game.id)
				game.delete()
				break

	html = "<p><b>Players deleted:</b></p>"
	for player_id in removed_player_ids:
		html = html + "<p>" + repr(player_id) + "</p>"

	html = html + "<p><p><b>Games deleted:</b></p>"
	for game_id in removed_game_ids:
		html = html + "<p>" + repr(game_id) + "</p>"

	# A view must return a "web response".
	return HttpResponse(html)

class UserCreationForm(forms.ModelForm):
	username = forms.RegexField(label="Username", max_length=30, regex=r'^[\w.@+-]+$',
        help_text = "Required. 30 characters or fewer. Letters, digits and @/./+/-/_ only.",
        error_messages = {'invalid': "This value may contain only letters, numbers and @/./+/-/_ characters."})
	password1 = forms.CharField(label="Password", widget=forms.PasswordInput)
	email = forms.EmailField(help_text = "Required")

	class Meta:
        	model = User
	        fields = ("username", "email")

	def clean_username(self):
        	username = self.cleaned_data["username"]
	        try:
        	    User.objects.get(username=username)
	        except User.DoesNotExist:
        	    return username
	        raise forms.ValidationError("A user with that username already exists.")

	def clean_password2(self):
        	password1 = self.cleaned_data.get("password1", "")
        	return password1

	def save(self, commit=True):
        	user = super(UserCreationForm, self).save(commit=False)
        	user.set_password(self.cleaned_data["password1"])
        	if commit:
            		user.save()
        	return user


@guest_allowed
def debug_view(request):
	user = str(request.user.id)
	if request.user.id is None:
		user = 'None'

	if request.POST:
        	form = UserCreationForm(request.POST)
	        if form.is_valid():
	            	form.save(True)
			username = request.POST['username']
            		password = request.POST['password1']
            		user = authenticate(username=username, password=password)
            		login(request, user)
    	else:
		form = UserCreationForm()
        return render_to_response("debug.html", {'form' : form, 'user': user, 'users': User.objects.all(), 'profiles':UserProfile.objects.all()}, context_instance=RequestContext(request))

@require_http_methods(["GET"])
def get_logged_in_user(request):
	if not request.is_ajax():
		return HttpResponseBadRequest()
	if request.user.id is None:
		return HttpResponseNotFound()

	ur = UserResource()
	user = ur.obj_get(pk=request.user.id)
	ur_bundle = ur.build_bundle(obj=user, request=request)

	return HttpResponse(ur.serialize(None, ur.full_dehydrate(ur_bundle), 'application/json'))
