"""
ASGI config for backend project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/asgi/
"""

import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

# IMPORTANTE: Primero llamar get_asgi_application() para inicializar Django
# ANTES de importar cualquier módulo que use modelos de Django (como simplejwt)
from django.core.asgi import get_asgi_application
django_asgi_app = get_asgi_application()

# AHORA es seguro importar los módulos que usan Django
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from apps.notificaciones import routing as notificaciones_routing

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AuthMiddlewareStack(
        URLRouter(
            notificaciones_routing.websocket_urlpatterns
        )
    )
})