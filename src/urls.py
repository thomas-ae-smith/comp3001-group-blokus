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
	(r'^create_piece/$', 'blokus.views.create_piece'),
	(r'^get_move/(?P<game_id>\d+)/$', 'blokus.views.get_number_of_moves'),
	(r'^skip_move/(?P<player_id>\d+)/$', 'blokus.views.skip_move'),
	(r'^login/$', 'blokus.views.login_journey'),
	(r'^$', 'blokus.views.base'),
	(r'^api/', include(rest_api.urls)),
	(r'^admin/', include(admin.site.urls)),
	(r'^logout/$', 'blokus.views.logout_journey'),
	(r'^debug/$', 'blokus.views.debug_view'),
	(r'^debug/spoof/(?P<id>\d+)/$', 'blokus.views.spoof_poll'),
	(r'^gc/$', 'blokus.views.execute_garbage_collection'),
	(r'^gc-g/$', 'guest.views.delete_old_guests'),
	url(r'', include('social_auth.urls')),
)
