from django.conf.urls.defaults import *
from django.contrib import admin
from tastypie.api import Api
from blokus.api import *
admin.autodiscover()

handler500 = 'djangotoolbox.errorviews.server_error'
rest_api = Api(api_name='rest')
rest_api.register(UserResource())
rest_api.register(UserProfileResource())
rest_api.register(GameResource())
rest_api.register(PieceMasterResource())
rest_api.register(PieceResource())
rest_api.register(PlayerResource())

urlpatterns = patterns('',
	(r'^_ah/warmup$', 'djangoappengine.views.warmup'),
	(r'^get_logged_in_user/$', 'blokus.views.get_logged_in_user'),
	(r'^login/$', 'django.contrib.auth.views.login'),
	(r'^logout/$', 'django.contrib.auth.views.logout'),
	(r'^$', 'django.views.generic.simple.direct_to_template', {'template': 'game.html'}),
	(r'^api/', include(rest_api.urls)),
	(r'^lobby/', 'django.views.generic.simple.direct_to_template', {'template':'lobby.html'}),
	(r'^admin/', include(admin.site.urls)),
	(r'^gc/$', 'blokus.views.execute_garbage_collection'),
)
