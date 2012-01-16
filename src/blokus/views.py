from django.shortcuts import render_to_response, get_object_or_404, redirect
from blokus.api import UserResource, UserProfileResource
from django.http import HttpResponse, HttpResponseNotFound, HttpResponseBadRequest
from django.core.exceptions import ObjectDoesNotExist
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from django.contrib.auth import authenticate, login, logout
from django import forms
from django.template import RequestContext
from datetime import timedelta, datetime
from blokus.models import *
from guest.utils import display_username

from guest.decorators import guest_allowed
from django.utils.hashcompat import md5_constructor

import logging

# Garbage collection function called by cronjob.
def execute_garbage_collection(request):
	# The amount of time which a single player may be disconnected for before the game is garbage-collected.
	TIMEOUT_IN_SECONDS = 60 * 5

	# If any game contains a player who has not been seen online in TIMEOUT_IN_SECONDS,
	# or contains a null player, delete the game and all its players.
	for game in Game.objects.all():
		if len (game.player_set.all()) < 4:
			game.delete()
			break
		for player in game.player_set.all():
			if (datetime.now() - player.last_activity).seconds > TIMEOUT_IN_SECONDS:
				player.delete()
				#Trigger clients to update game
				game.number_of_moves += 1
				game.save()

	return HttpResponse("Cron executed")

class UserCreationForm(forms.ModelForm):
	username = forms.RegexField(label="Username", max_length=30, regex=r'^[\w.@+-]+$',
        help_text = "Required. 30 characters or fewer. Letters, digits and @/./+/-/_ only.",
        error_messages = {'invalid': "The username may contain only letters, numbers and @/./+/-/_ characters.", 'required': 'Username required'})
	password1 = forms.CharField(label="Password", widget=forms.PasswordInput, error_messages={'required': 'Password is required.'})
	password2 = forms.CharField(label="Password confirmation", widget=forms.PasswordInput, help_text="Enter the same password as above, for verification.", error_messages={'required': 'Password confirmation required.'})
	email = forms.EmailField(label="Email Address", help_text = "Required", error_messages={'required': 'Email address is required.'})

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
		password2 = self.cleaned_data["password2"]
		if password1 != password2:
			raise forms.ValidationError("The two password fields didn't match.")
		return password2

	def save(self, commit=True):
		user = super(UserCreationForm, self).save(commit=False)
		user.set_password(self.cleaned_data["password1"])
		if commit:
			user.save()
		return user

@guest_allowed
def base(request):
	form = UserCreationForm()
	if request.POST:
		form = UserCreationForm(request.POST)
		if form.is_valid():
			form.save(True)
			username = request.POST['username']
			password = request.POST['password1']
			user = authenticate(username=username, password=password)

			user.get_profile().profile_image_url = "http://www.gravatar.com/avatar/%s?s=40&d=identicon" % md5_constructor(request.POST['email'].strip().lower())
			user.get_profile().save()

			login(request, user)
		else:
			return render_to_response("base.html", {'form' : form, 'redirect':'register'}, context_instance=RequestContext(request))
	return render_to_response("base.html", {'form' : form}, context_instance=RequestContext(request))

def logout_journey(request):
	logout(request)
	return redirect('blokus.views.base')

def login_journey(request):
	username = request.POST['username'];
	password = request.POST['password'];
	user = authenticate(username=username, password=password)
	if user is not None:
		if user.is_active:
			login(request, user)
			return HttpResponse("true")
		else:
			return HttpResponse("Account disabled!")
	else:
		return HttpResponse("Invalid username/password!")

@guest_allowed
def debug_view(request):
	user = str(request.user.id)
	if request.user.id is None:
		user = 'None'
	profiles = UserProfile.objects.all()
	form = UserCreationForm()
	message = ""

	if request.POST:
		if 'Add user' in request.POST:
	        	form = UserCreationForm(request.POST)
		        if form.is_valid():
	        	    	form.save(True)
				username = request.POST['username']
	            		password = request.POST['password1']
        	    		user = authenticate(username=username, password=password)
            			login(request, user)
				message = "You are now logged in as new user %s" % username
		else:
			message = request.POST
			for p in profiles:
				if 'c%d' % p.id in request.POST:
					message = 'User %d now set to %s' % (p.user.id, request.POST['c%d' % p.id])
					change_profile = get_object_or_404(UserProfile, pk=p.id)
					change_profile.status = request.POST['c%d' % p.id]
					change_profile.save()
					profiles = UserProfile.objects.all()
        return render_to_response("debug.html", {'form' : form, 'user': user, 'users': User.objects.all(), 'profiles':profiles, 'message':message}, context_instance=RequestContext(request))

def spoof_poll(request, id):
	request.user = get_object_or_404(User, pk=id)
	UserProfileResource().get_object_list(request)
	return redirect('blokus.views.debug_view')

@require_http_methods(["GET"])
def get_logged_in_user(request):
	if not request.is_ajax():
		return HttpResponseBadRequest()
	if request.user.id is None:
		return HttpResponseNotFound()

	ur = UserResource()
	user = User.objects.get(pk=request.user.id)
	user.username = display_username(user)
	ur_bundle = ur.build_bundle(obj=user, request=request)

	full_bundle = ur.full_dehydrate(ur_bundle)

	return HttpResponse(ur.serialize(None, ur.full_dehydrate(ur_bundle), 'application/json'))

@require_http_methods(["GET", "POST"])
def create_piece(request):
	if not request.is_ajax():
		return HttpResponseBadRequest()
	if request.user.id is None:
		return HttpResponseNotFound()
	#master_id
	#x
	#y
	#flip
	#rotate

@require_http_methods("GET")
@login_required
def get_number_of_moves(request, game_id):
	if not request.is_ajax():
		return HttpResponseBadRequest()
	if request.user.id is None:
		return HttpResponseNotFound()
	game = Game.objects.get(pk=game_id)
	if (datetime.now() - game.last_move_time).seconds > 120:
		game.continuous_skips += 1
		game.number_of_moves += 1
		game.colour_turn = game.get_next_colour_turn()
		game.turn_complete()
		game.save()

	return HttpResponse(game.number_of_moves, content_type="text/plain")

@require_http_methods("GET")
@login_required
def skip_move(request, player_id):
	if not request.is_ajax():
		return HttpResponseBadRequest()
	if request.user.id is None:
		return HttpResponseNotFound()
	try:
		player = Player.objects.get(pk=player_id)
		game = player.game
		if not game.colour_turn == player.colour:
			return HttpResponseBadRequest()
		player.last_activity = datetime.now()
		player.save()
		game.continuous_skips += 1
		game.colour_turn = game.get_next_colour_turn()
		game.number_of_moves += 1
		game.save()
		game.turn_complete()
		return HttpResponse("", content_type="text/plain")
	except ObjectDoesNotExist:
		return HttpResponseNotFound()
			
