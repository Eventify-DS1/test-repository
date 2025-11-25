from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated, AllowAny
from .permissions import IsAdmin, IsOwnerOrAdmin
from rest_framework.decorators import action
from django.contrib.auth.models import AnonymousUser
from .models import Usuario, Rol
from .serializer import UsuarioSerializer, RolSerializer, EstadisticasUsuariosSerializer
from .tasks import send_email_user_created

class RolViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar roles del sistema. Solo permitido para administradores.
    - Permite listar, crear, actualizar y eliminar roles.
    """
    # Aplicamos el permiso 'IsAdmin' a TODAS las acciones de este ViewSet
    permission_classes = [IsAdmin]
    
    queryset = Rol.objects.all()
    serializer_class = RolSerializer
    # permission_classes = [IsAuthenticated]  # Solo usuarios autenticados pueden modificar roles

    filterset_fields = ['nombre']

    # Buscar roles por nombre (coincidencia parcial)
    search_fields = ['nombre']

    # Ordenar resultados
    ordering_fields = ['nombre']
    ordering = ['nombre']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return super().get_permissions()

class UsuarioViewSet(viewsets.ModelViewSet):
    """
    ViewSet para el modelo Usuario.
    Permite registrar nuevos usuarios y gestionar sus datos.
    """

    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer

    filterset_fields = ['rol', 'facultad', 'carrera']

    # Buscar por nombre, username o email
    search_fields = ['username', 'first_name', 'last_name', 'email']

    # Ordenar por username, fecha de creación o nombre
    ordering_fields = ['username', 'first_name', 'last_name', 'email']
    ordering = ['username']

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def estadisticas(self, request):
        """
        Endpoint para obtener estadísticas de usuarios.
        Accesible públicamente sin autenticación.
        """
        # Crear una instancia ficticia para el serializer
        usuario = Usuario.objects.first() if Usuario.objects.exists() else None
        
        serializer = EstadisticasUsuariosSerializer(usuario)
        return Response(serializer.data, status=status.HTTP_200_OK)

    
    
    def get_permissions(self):
        """
        Define permisos según la acción:
        - create (Registro): Abierto para cualquiera.
        - list (Ver todos): Solo Admins.
        - retrieve (Ver detalle): El propio usuario o un Admin.
        - update/partial_update (Editar): El propio usuario o un Admin.
        - destroy (Borrar): Solo Admins.
        """
        if self.action == 'create':
            return [AllowAny()]

        if self.action == 'estadisticas':
            return [AllowAny()]

        if self.action == 'list':
            return [IsAdmin()]
        
        if self.action == 'destroy':
            return [IsAdmin()]
        
        if self.action in ['retrieve', 'update', 'partial_update']:
            return [IsAuthenticated(), IsOwnerOrAdmin()]
        
        if self.action == 'count_users':  
            return [AllowAny()]
        return [IsAuthenticated()]
       

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def count_users(self, request):
        """Retorna el total de usuarios registrados."""
        total = Usuario.objects.count()
        return Response({'total': total})
    
    @action(detail=False, methods=['get', 'patch'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """
        Endpoint para obtener y actualizar el usuario actual autenticado.
        """
        if request.method == 'GET':
            serializer = self.get_serializer(request.user)
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        elif request.method == 'PATCH':
            serializer = self.get_serializer(request.user, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(
                {
                    "message": "Perfil actualizado correctamente.",
                    "usuario": serializer.data
                },
                status=status.HTTP_200_OK
            )

    def perform_create(self, serializer):
        """
        Guarda el usuario validando y aplicando lógica de serializer.
        No se asigna ningún campo automático aquí porque la lógica
        de encriptar contraseñas ya está dentro del serializer.
        """
        user_created = serializer.save()
        send_email_user_created.delay(user_created.id, user_created.username, user_created.email)

    def create(self, request, *args, **kwargs):
        """
        Sobrescribe create para personalizar la respuesta de registro.
        Después del registro, el usuario debe completar MFA antes de poder usar la aplicación.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        # Usuario recién creado
        user = serializer.instance
        
        # Si MFA está habilitado, generar código MFA
        if user.mfa_enabled:
            from .models import MFACode
            from .mfa_tasks import send_mfa_code_email
            import secrets
            
            session_id = secrets.token_urlsafe(32)
            mfa_code_obj = MFACode.generar_codigo(user, session_id)
            
            # Enviar código por email
            email_sent = False
            try:
                send_mfa_code_email.delay(user.email, user.username, mfa_code_obj.codigo)
                email_sent = True
            except Exception:
                # Fallback síncrono
                from .mfa_tasks import _send_mfa_email_sync
                try:
                    email_sent = _send_mfa_email_sync(user.email, user.username, mfa_code_obj.codigo)
                    if not email_sent:
                        import logging
                        logger = logging.getLogger(__name__)
                        logger.error(f"No se pudo enviar código MFA a {user.email} después del registro")
                except Exception as sync_error:
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.error(f"Error enviando código MFA después del registro: {sync_error}")
            
            headers = self.get_success_headers(serializer.data)
            from django.conf import settings
            response_data = {
                "message": "Usuario registrado correctamente. Se ha enviado un código de verificación a tu email." if email_sent else "Usuario registrado correctamente. No se pudo enviar el código por email. Verifica la configuración de email.",
                "usuario": serializer.data,
                "mfa_required": True,
                "session_id": session_id,
                "email_sent": email_sent
            }
            
            # Solo en desarrollo, incluir el código en la respuesta para facilitar pruebas
            if not email_sent and settings.DEBUG:
                response_data["codigo"] = mfa_code_obj.codigo
                response_data["warning"] = "Código mostrado solo en modo desarrollo. Configura el email para producción."
            
            return Response(
                response_data,
                status=status.HTTP_201_CREATED,
                headers=headers
            )
        else:
            # Si MFA no está habilitado, proceder con login normal (no debería pasar normalmente)
            refresh = RefreshToken.for_user(user)
            access = str(refresh.access_token)
            
            headers = self.get_success_headers(serializer.data)
            response_data = {
                "message": "Usuario registrado correctamente.",
                "usuario": serializer.data
            }
            
            response = Response(
                response_data,
                status=status.HTTP_201_CREATED,
                headers=headers
            )
            
            # Se envían las cookies usando httpOnly y Secure con tiempo de expiración
            from django.conf import settings
            access_lifetime = int(settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds())
            refresh_lifetime = int(settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds())
            secure_flag = not settings.DEBUG
            
            response.set_cookie(
                key='access',
                value=access,
                httponly=True,
                secure=secure_flag,
                samesite='Lax',
                max_age=access_lifetime,
                path='/',
                domain=None,
            )
            
            response.set_cookie(
                key='refresh',
                value=str(refresh),
                httponly=True,
                secure=secure_flag,
                samesite='Lax',
                max_age=refresh_lifetime,
                path='/',
                domain=None,
            )
            
            return response

