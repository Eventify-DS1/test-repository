# urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UsuarioViewSet, RolViewSet
from .auth_views import (CookieTokenObtainPairView, 
                         CookieTokenRefreshView, 
                         CookieTokenVerifyView, 
                         LogoutView,
                         MFAResendCodeView,
                         CSRFTokenView,
                         PasswordResetRequestView,
                         PasswordResetVerifyView,
                         PasswordResetConfirmView
                         )

# Creamos el router
router = DefaultRouter()

# Registramos los ViewSets
router.register(r'usuarios', UsuarioViewSet, basename='usuario')
router.register(r'roles', RolViewSet, basename='rol')

# Incluimos las rutas generadas automáticamente
urlpatterns = [
    path('', include(router.urls)),
    path('csrf-token/', CSRFTokenView.as_view(), name='csrf_token'),  # Endpoint para obtener token CSRF
    path('login/', CookieTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', CookieTokenRefreshView.as_view(), name='token_refresh'),
    path('verify/', CookieTokenVerifyView.as_view(), name='token_verify'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('mfa/resend/', MFAResendCodeView.as_view(), name='mfa_resend'),
    # Recuperación de contraseña
    path('password-reset/request/', PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('password-reset/verify/', PasswordResetVerifyView.as_view(), name='password_reset_verify'),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
]