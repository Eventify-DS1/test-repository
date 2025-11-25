from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/prueba/$', consumers.PruebaConsumer.as_asgi()),
    re_path(r'ws/notifications/$', consumers.NotificationConsumer.as_asgi()),
    # Aquí irían más rutas de eventos...
]