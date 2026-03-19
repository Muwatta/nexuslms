# backend/nexuslms/asgi.py
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'nexuslms.settings.dev')

# Setup Django BEFORE importing anything else
django.setup()

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from api import routing  # Import after django.setup()

django_asgi_app = get_asgi_application()

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AuthMiddlewareStack(
        URLRouter(routing.websocket_urlpatterns)
    ),
})