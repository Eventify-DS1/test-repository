# urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UsuarioViewSet, RolViewSet
from .auth_views import (CookieTokenObtainPairView, 
                         CookieTokenRefreshView, 
                         CookieTokenVerifyView, 
                         LogoutView
                         )

# Creamos el router
router = DefaultRouter()

# Registramos los ViewSets
router.register(r'usuarios', UsuarioViewSet, basename='usuario')
router.register(r'roles', RolViewSet, basename='rol')

# Incluimos las rutas generadas automáticamente
urlpatterns = [
    path('', include(router.urls)),
    path('login/', CookieTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', CookieTokenRefreshView.as_view(), name='token_refresh'),
    path('verify/', CookieTokenVerifyView.as_view(), name='token_verify'),
    path('logout/', LogoutView.as_view(), name='logout'),
]