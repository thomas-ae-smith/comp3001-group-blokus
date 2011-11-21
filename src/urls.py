from django.conf.urls.defaults import *
from django.contrib import admin
admin.autodiscover()

handler500 = 'djangotoolbox.errorviews.server_error'

urlpatterns = patterns('',
    ('^_ah/warmup$', 'djangoappengine.views.warmup'),
    ('^$', 'django.views.generic.simple.direct_to_template',
     {'template': 'game.html'}),
	url(r'^lobby/', 'django.views.generic.simple.direct_to_template', {'template':'lobby.html'}),
    url(r'^admin/', include(admin.site.urls)),
)
