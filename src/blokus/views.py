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

	# If any player has been disconnected for longer than TIMEOUT_IN_SECONDS, delete them and the game they were in.
	remove_set = set()
	for player in Player.objects.all():
		if (datetime.now() - player.last_activity).seconds > TIMEOUT_IN_SECONDS:
			for dead_game_player in player.game.player_set.all():
				remove_set.add(dead_game_player)
			player.game.delete()

	# Players to be removed are added to a removal set because if they were
	# removed in the above loop then odd things could happen while looping
	# through Player.objects.all().
	for player in remove_set:
		player.delete()

	# A view must return a "web response".
	return HttpResponseNotFound('<h1>ZOMG, CRON JOB!</h1>')

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
