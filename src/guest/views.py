from django.http import HttpResponse
from .utils import cleanup_guests

# Internal view called by cron.yaml
def delete_old_guests(request):
	cleanup_guests()
	return HttpResponse("<p>Old guests deleted.</p>")
