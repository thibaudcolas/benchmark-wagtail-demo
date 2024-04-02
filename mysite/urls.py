from django.conf import settings
from django.urls import include, path

from wagtail.admin import urls as wagtailadmin_urls
from wagtail import urls as wagtail_urls

from mysite.api import api_router

urlpatterns = [
    path("admin/", include(wagtailadmin_urls)),
    path('api/v2/', api_router.urls),
]

if settings.DEBUG:
    from django.contrib.staticfiles.urls import staticfiles_urlpatterns

    # Serve static and media files from development server
    urlpatterns += staticfiles_urlpatterns()

urlpatterns += [
    path("", include(wagtail_urls)),
]
