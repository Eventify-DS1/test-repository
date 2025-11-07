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
        serializer.save()

    def create(self, request, *args, **kwargs):
        """
        Sobrescribe create para personalizar la respuesta de registro.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        # Creación de par tokens para el usuario recién creado
        user = serializer.instance
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
        
        # Se envían las cookies usando httpOnly y Secure
        response.set_cookie(
            key='access',
            value=access,
            httponly=True,
            secure=False,  # True en producción con HTTPS, False para desarrollo local
            samesite='Lax'  # 'None' requiere secure=True, 'Lax' funciona en local
        )
        
        response.set_cookie(
            key='refresh',
            value=str(refresh),
            httponly=True,
            secure=False,  # True en producción con HTTPS, False para desarrollo local
            samesite='Lax'
        )
        
        return response

