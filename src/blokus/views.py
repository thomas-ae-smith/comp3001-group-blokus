from django.shortcuts import render_to_response
from blokus.api import UserResource
from django.http import HttpResponse, HttpResponseNotFound, HttpResponseBadRequest
from django.views.decorators.http import require_http_methods
from datetime import timedelta, datetime

def execute_garbage_collection(request):
	#The amount of time which a single player may be disconnected for before the game is garbage-collected.
	TIMEOUT_IN_SECONDS = 60 * 2

	#If any player has been disconnected for longer than TIMEOUT_IN_SECONDS, delete them and the game they were in.
	for player in Player.objects.all():
		if (datetime.now - player.last_activity).seconds > TIMEOUT_IN_SECONDS:
			#do stuff

	#A view must return a "web response".
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
