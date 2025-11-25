from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView, TokenVerifyView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework import generics
from rest_framework_simplejwt.tokens import RefreshToken
from datetime import timedelta


class CookieTokenObtainPairView(TokenObtainPairView):
    """Login con JWT almacenado en cookies seguras."""
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        data = response.data
        access = data.get('access')
        refresh = data.get('refresh')

        # Set cookies seguras (HttpOnly) con tiempo de expiración
        # Access token: 20 minutos (1200 segundos)
        # Refresh token: 1 día (86400 segundos)
        # Nota: samesite='Lax' funciona en desarrollo local con CORS configurado
        response.set_cookie(
            key='access',
            value=access,
            httponly=True,
            secure=False,  # True en producción con HTTPS, False para desarrollo local
            samesite='Lax',  # 'Lax' funciona en desarrollo local con CORS
            max_age=1200,  # 20 minutos en segundos
            path='/',  # Disponible en todas las rutas
            domain=None,  # None permite que funcione en localhost sin especificar dominio
        )
        response.set_cookie(
            key='refresh',
            value=refresh,
            httponly=True,
            secure=False,  # True en producción con HTTPS, False para desarrollo local
            samesite='Lax',  # 'Lax' funciona en desarrollo local con CORS
            max_age=86400,  # 1 día en segundos
            path='/',  # Disponible en todas las rutas
            domain=None,  # None permite que funcione en localhost sin especificar dominio
        )

        response.data = {"detail": "Login exitoso"}
        return response

class CookieTokenRefreshView(TokenRefreshView):
    """Refresca el access token usando el refresh guardado en cookies."""
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get('refresh')
        if not refresh_token:
            return Response({"error": "No refresh token found"}, status=status.HTTP_401_UNAUTHORIZED)

        request.data['refresh'] = refresh_token
        response = super().post(request, *args, **kwargs)
        new_access = response.data.get('access')

        response.set_cookie(
            key='access',
            value=new_access,
            httponly=True,
            secure=False,  # True en producción con HTTPS, False para desarrollo local
            samesite='Lax',  # 'Lax' funciona en desarrollo local con CORS
            max_age=1200,  # 20 minutos en segundos
            path='/',  # Disponible en todas las rutas
            domain=None,  # None permite que funcione en localhost sin especificar dominio
        )
        response.data = {"detail": "Token refreshed"}
        return response

class CookieTokenVerifyView(TokenVerifyView):
    """Verifica el token access desde la cookie."""
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        token = request.COOKIES.get('access')
        if not token:
            return Response({"error": "No access token found"}, status=status.HTTP_401_UNAUTHORIZED)
        request.data['token'] = token
        return super().post(request, *args, **kwargs)

class LogoutView(APIView):
    """Logout: limpia cookies y revoca el refresh token (opcional)."""
    permission_classes = [AllowAny]

    def post(self, request):
        response = Response({"detail": "Logout exitoso"}, status=status.HTTP_205_RESET_CONTENT)

        # Eliminar cookies con los mismos atributos que se usaron para crearlas
        response.delete_cookie('access', samesite='Lax', path='/')
        response.delete_cookie('refresh', samesite='Lax', path='/')

        # Blacklist opcional si usas token_blacklist
        refresh_token = request.COOKIES.get('refresh')
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception:
                pass

        return response
