from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.http import HttpResponse

# simple home page view
def home(request):
    return HttpResponse("Welcome to Nexus LMS!")

urlpatterns = [
    path("", home),
    path("admin/", admin.site.urls),

    # JWT Auth
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    # API
    path("api/", include("api.urls")),
]

# serve media in dev
from django.conf import settings
from django.conf.urls.static import static

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

