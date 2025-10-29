# urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UsuarioViewSet

# Creamos el router
router = DefaultRouter()

# Registramos los ViewSets
router.register(r'usuarios', UsuarioViewSet, basename='usuario')

# Incluimos las rutas generadas automáticamente
urlpatterns = [
    path('', include(router.urls)),
]