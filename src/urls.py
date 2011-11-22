from django.conf.urls.defaults import *
from django.contrib import admin
from tastypie.api import Api
from blokus.api import *
admin.autodiscover()

handler500 = 'djangotoolbox.errorviews.server_error'
rest_api = Api(api_name='rest')
rest_api.register(UserResource())



urlpatterns = patterns('',
	('^_ah/warmup$', 'djangoappengine.views.warmup'),
	('^$', 'django.views.generic.simple.direct_to_template', {'template': 'game.html'}),
	(r'^api/', include(rest_api.urls)),
	(r'^lobby/', 'django.views.generic.simple.direct_to_template', {'template':'lobby.html'}),	
	(r'^admin/', include(admin.site.urls)),
)
