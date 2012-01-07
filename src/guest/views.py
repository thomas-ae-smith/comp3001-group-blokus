from django.http import HttpResponse

# Internal view called by cron.yaml
def delete_old_guests(request):
	cleanup_guests()
	return HttpResponse("<p>Old guests deleted</p>")
