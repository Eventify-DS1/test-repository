"""
ASGI config for backend project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/asgi/
"""

import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
from channels.routing import ProtocolTypeRouter,URLRouter
from channels.auth import AuthMiddlewareStack
from apps.notificaciones import routing as notificaciones_routing

django_asgi_app = get_asgi_application()

application = ProtocolTypeRouter({

    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(
            notificaciones_routing.websocket_urlpatterns
        )
    )
})