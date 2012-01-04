from django.shortcuts import render_to_response
from blokus.api import UserResource
from django.http import HttpResponse, HttpResponseNotFound, HttpResponseBadRequest
from django.views.decorators.http import require_http_methods
from datetime import timedelta, datetime
from blokus.models import *

# Garbage collection function called by cronjob.
def execute_garbage_collection(request):
	# The amount of time which a single player may be disconnected for before the game is garbage-collected.
	TIMEOUT_IN_SECONDS = 60 * 2 #The 10 minutes mentioned in the design doc seems like ages, but feel free to change this.

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

def debug(request):
	return HttpResponse("<p>hello</p>")

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
