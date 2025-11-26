from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView, TokenVerifyView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework import generics
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from django.conf import settings
from django.contrib.auth import authenticate
from django.utils import timezone
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.decorators import method_decorator
from django.core.cache import cache
from datetime import timedelta
import secrets
from .models import Usuario, MFACode, LoginAttempt
from .mfa_tasks import send_mfa_code_email


class CookieTokenObtainPairView(TokenObtainPairView):
    """
    Login con JWT almacenado en cookies seguras.
    Implementa MFA (Multi-Factor Authentication) si está habilitado.
    """
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        # Verificar si se está enviando un código MFA
        mfa_code = request.data.get('mfa_code')
        session_id = request.data.get('session_id')
        
        # Si hay código MFA, verificar y completar login
        if mfa_code and session_id:
            return self._verify_mfa_and_login(request, mfa_code, session_id)
        
        # Protección contra fuerza bruta
        ip_address = self._get_client_ip(request)
        username = request.data.get('username')
        
        # Verificar si está bloqueado
        login_attempt = LoginAttempt.obtener_o_crear(ip_address, username)
        if login_attempt.esta_bloqueado():
            tiempo_restante = (login_attempt.bloqueado_hasta - timezone.now()).total_seconds()
            minutos_restantes = int(tiempo_restante / 60) + 1
            return Response(
                {
                    "error": f"Demasiados intentos fallidos. Intenta nuevamente en {minutos_restantes} minutos.",
                    "bloqueado": True,
                    "minutos_restantes": minutos_restantes
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )
        
        # Si no hay código MFA, validar credenciales y generar código MFA
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except Exception as e:
            login_attempt.incrementar_intento()
            return Response(
                {"error": "Credenciales inválidas"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Obtener usuario
        password = request.data.get('password')
        user = authenticate(username=username, password=password)
        
        if not user:
            login_attempt.incrementar_intento()
            return Response(
                {"error": "Credenciales inválidas"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Login exitoso, resetear intentos
        login_attempt.resetear()
        
        # Verificar si MFA está habilitado para el usuario
        if not user.mfa_enabled:
            # Si MFA no está habilitado, proceder con login normal
            return self._complete_login(user)
        
        # Verificar si necesita MFA basado en el tiempo transcurrido
        # MFA es requerido si:
        # 1. Es un nuevo registro (last_mfa_verification es None)
        # 2. Ha pasado más tiempo que el refresh token lifetime (1 día) desde la última verificación
        refresh_token_lifetime = settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME']
        necesita_mfa = False
        
        if user.last_mfa_verification is None:
            # Usuario nuevo o nunca ha hecho MFA
            necesita_mfa = True
        else:
            # Verificar si ha pasado más tiempo que el refresh token lifetime
            tiempo_desde_mfa = timezone.now() - user.last_mfa_verification
            if tiempo_desde_mfa > refresh_token_lifetime:
                necesita_mfa = True
        
        # Si no necesita MFA, proceder con login normal
        if not necesita_mfa:
            return self._complete_login(user)
        
        # Generar código MFA
        session_id = secrets.token_urlsafe(32)
        mfa_code_obj = MFACode.generar_codigo(user, session_id)
        
        # Enviar código por email de forma asíncrona (con fallback síncrono)
        email_sent = False
        try:
            send_mfa_code_email.delay(user.email, user.username, mfa_code_obj.codigo)
            email_sent = True
        except Exception as e:
            # Fallback: enviar síncronamente si Celery no está disponible
            from .mfa_tasks import _send_mfa_email_sync
            try:
                email_sent = _send_mfa_email_sync(user.email, user.username, mfa_code_obj.codigo)
                if not email_sent:
                    # Si no se pudo enviar, registrar error pero continuar
                    # El código sigue siendo válido y el usuario puede solicitarlo de nuevo
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.error(f"No se pudo enviar código MFA a {user.email}")
            except Exception as sync_error:
                # Si también falla el envío síncrono, registrar error pero continuar
                # El código sigue siendo válido y el usuario puede solicitarlo de nuevo
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Error enviando código MFA: {sync_error}")
        
        response_data = {
            "detail": "Código de verificación enviado a tu email" if email_sent else "No se pudo enviar el código por email. Verifica la configuración de email.",
            "session_id": session_id,
            "mfa_required": True,
            "email_sent": email_sent
        }
        
        # Solo en desarrollo, incluir el código en la respuesta para facilitar pruebas
        if not email_sent and settings.DEBUG:
            response_data["codigo"] = mfa_code_obj.codigo
            response_data["warning"] = "Código mostrado solo en modo desarrollo. Configura el email para producción."
        
        return Response(response_data, status=status.HTTP_200_OK)
    
    def _verify_mfa_and_login(self, request, mfa_code, session_id):
        """Verifica el código MFA y completa el login"""
        try:
            mfa_code_obj = MFACode.objects.get(session_id=session_id, usado=False)
        except MFACode.DoesNotExist:
            return Response(
                {"error": "Sesión inválida o código ya usado"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verificar si el código es válido
        if not mfa_code_obj.es_valido():
            mfa_code_obj.incrementar_intentos()
            return Response(
                {"error": "Código expirado o inválido"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verificar el código
        if mfa_code_obj.codigo != mfa_code:
            mfa_code_obj.incrementar_intentos()
            
            # Bloquear después de X intentos fallidos (configurable)
            max_intentos_mfa = getattr(settings, 'MFA_MAX_ATTEMPTS', 5)
            if mfa_code_obj.intentos >= max_intentos_mfa:
                mfa_code_obj.marcar_como_usado()
                return Response(
                    {"error": "Demasiados intentos fallidos. Por favor, inicia sesión nuevamente."},
                    status=status.HTTP_429_TOO_MANY_REQUESTS
                )
            
            return Response(
                {"error": "Código de verificación incorrecto"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Código correcto, marcar como usado y actualizar última verificación MFA
        mfa_code_obj.marcar_como_usado()
        user = mfa_code_obj.usuario
        
        # Actualizar la última vez que el usuario completó MFA exitosamente
        user.last_mfa_verification = timezone.now()
        user.save(update_fields=['last_mfa_verification'])
        
        # Resetear intentos de login después de login exitoso
        ip_address = self._get_client_ip(request)
        try:
            login_attempt = LoginAttempt.objects.get(ip_address=ip_address, username=user.username)
            login_attempt.resetear()
        except LoginAttempt.DoesNotExist:
            pass
        
        return self._complete_login(user)
    
    def _complete_login(self, user):
        """Completa el proceso de login estableciendo las cookies"""
        # Generar tokens
        refresh = RefreshToken.for_user(user)
        access = str(refresh.access_token)
        
        # Configuración de cookies
        access_lifetime = int(settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds())
        refresh_lifetime = int(settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds())
        secure_flag = not settings.DEBUG
        samesite_flag = 'Strict' if not settings.DEBUG else 'Lax'  # Strict en producción, Lax en desarrollo
        
        response = Response(
            {"detail": "Login exitoso"},
            status=status.HTTP_200_OK
        )
        
        response.set_cookie(
            key='access',
            value=access,
            httponly=True,
            secure=secure_flag,
            samesite=samesite_flag,
            max_age=access_lifetime,
            path='/',
            domain=None,
        )
        response.set_cookie(
            key='refresh',
            value=str(refresh),
            httponly=True,
            secure=secure_flag,
            samesite=samesite_flag,
            max_age=refresh_lifetime,
            path='/',
            domain=None,
        )
        
        return response
    
    def _get_client_ip(self, request):
        """Obtiene la dirección IP real del cliente"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

class CookieTokenRefreshView(TokenRefreshView):
    """Refresca el access token usando el refresh guardado en cookies."""
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get('refresh')
        if not refresh_token:
            return Response({"error": "No refresh token found"}, status=status.HTTP_401_UNAUTHORIZED)

        # Validar que el token no esté en blacklist
        try:
            token = RefreshToken(refresh_token)
            token.check_blacklist()
        except (TokenError, InvalidToken):
            return Response({"error": "Invalid or blacklisted refresh token"}, status=status.HTTP_401_UNAUTHORIZED)

        request.data['refresh'] = refresh_token
        response = super().post(request, *args, **kwargs)
        new_access = response.data.get('access')
        new_refresh = response.data.get('refresh')  # Puede existir si ROTATE_REFRESH_TOKENS = True

        # Configuración de cookies
        access_lifetime = int(settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds())
        refresh_lifetime = int(settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds())
        secure_flag = not settings.DEBUG
        samesite_flag = 'Strict' if not settings.DEBUG else 'Lax'  # Strict en producción, Lax en desarrollo

        # Actualizar access token
        response.set_cookie(
            key='access',
            value=new_access,
            httponly=True,
            secure=secure_flag,
            samesite=samesite_flag,
            max_age=access_lifetime,
            path='/',
            domain=None,
        )

        # Si se rotó el refresh token, actualizar la cookie también
        if new_refresh:
            response.set_cookie(
                key='refresh',
                value=new_refresh,
                httponly=True,
                secure=secure_flag,
                samesite=samesite_flag,
                max_age=refresh_lifetime,
                path='/',
                domain=None,
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
        # Nota: delete_cookie() no acepta 'secure', pero Django maneja la eliminación
        # correctamente si usamos los mismos path y domain
        samesite_flag = 'Strict' if not settings.DEBUG else 'Lax'
        response.delete_cookie('access', samesite=samesite_flag, path='/')
        response.delete_cookie('refresh', samesite=samesite_flag, path='/')

        # Blacklist opcional si usas token_blacklist
        refresh_token = request.COOKIES.get('refresh')
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception:
                pass

        return response


class CSRFTokenView(APIView):
    """
    Endpoint para obtener el token CSRF.
    Necesario para APIs REST que usan cookies.
    """
    permission_classes = [AllowAny]
    
    @method_decorator(ensure_csrf_cookie)
    def get(self, request):
        """Devuelve el token CSRF en la cookie y en la respuesta"""
        csrf_token = get_token(request)
        return Response({
            'csrf_token': csrf_token
        }, status=status.HTTP_200_OK)

class MFAResendCodeView(APIView):
    """Reenvía el código MFA si el usuario no lo recibió."""
    permission_classes = [AllowAny]
    
    def post(self, request):
        session_id = request.data.get('session_id')
        
        if not session_id:
            return Response(
                {"error": "session_id es requerido"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            mfa_code_obj = MFACode.objects.get(session_id=session_id, usado=False)
        except MFACode.DoesNotExist:
            return Response(
                {"error": "Sesión inválida"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verificar si el código anterior aún es válido
        if mfa_code_obj.es_valido():
            # Reenviar el mismo código
            email_sent = False
            try:
                send_mfa_code_email.delay(
                    mfa_code_obj.usuario.email,
                    mfa_code_obj.usuario.username,
                    mfa_code_obj.codigo
                )
                email_sent = True
            except Exception:
                # Fallback síncrono
                from .mfa_tasks import _send_mfa_email_sync
                try:
                    email_sent = _send_mfa_email_sync(
                        mfa_code_obj.usuario.email,
                        mfa_code_obj.usuario.username,
                        mfa_code_obj.codigo
                    )
                except Exception as e:
                    # Registrar error pero continuar
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.error(f"Error al enviar código MFA: {str(e)}")
                    email_sent = False
            
            # Si el email no se pudo enviar, devolver advertencia pero permitir continuar
            # En desarrollo, incluir el código en la respuesta para facilitar pruebas
            response_data = {
                "detail": "Código de verificación reenviado" if email_sent else "No se pudo enviar el código por email. Verifica la configuración de email.",
                "email_sent": email_sent
            }
            
            # Solo en desarrollo, incluir el código en la respuesta
            if not email_sent and settings.DEBUG:
                response_data["codigo"] = mfa_code_obj.codigo
                response_data["warning"] = "Código mostrado solo en modo desarrollo. Configura el email para producción."
            
            return Response(response_data, status=status.HTTP_200_OK)
        else:
            # Generar nuevo código
            user = mfa_code_obj.usuario
            mfa_code_obj.marcar_como_usado()  # Invalidar el anterior
            new_mfa_code = MFACode.generar_codigo(user, session_id)
            
            email_sent = False
            try:
                send_mfa_code_email.delay(
                    user.email,
                    user.username,
                    new_mfa_code.codigo
                )
                email_sent = True
            except Exception:
                # Fallback síncrono
                from .mfa_tasks import _send_mfa_email_sync
                try:
                    email_sent = _send_mfa_email_sync(
                        user.email,
                        user.username,
                        new_mfa_code.codigo
                    )
                except Exception as e:
                    # Registrar error pero continuar
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.error(f"Error al enviar código MFA: {str(e)}")
                    email_sent = False
            
            # Si el email no se pudo enviar, devolver advertencia pero permitir continuar
            # En desarrollo, incluir el código en la respuesta para facilitar pruebas
            response_data = {
                "detail": "Código de verificación reenviado" if email_sent else "No se pudo enviar el código por email. Verifica la configuración de email.",
                "email_sent": email_sent
            }
            
            # Solo en desarrollo, incluir el código en la respuesta
            if not email_sent and settings.DEBUG:
                response_data["codigo"] = new_mfa_code.codigo
                response_data["warning"] = "Código mostrado solo en modo desarrollo. Configura el email para producción."
            
            return Response(response_data, status=status.HTTP_200_OK)
