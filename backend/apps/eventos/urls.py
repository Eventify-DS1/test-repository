# urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EventoViewSet, CategoriaEventoViewSet

# Creamos el router
router = DefaultRouter()

# Registramos los ViewSets
router.register(r'eventos', EventoViewSet, basename='evento')
router.register(r'categorias', CategoriaEventoViewSet, basename='categoria')



# Incluimos las rutas generadas automáticamente
urlpatterns = [
    path('', include(router.urls)),
]