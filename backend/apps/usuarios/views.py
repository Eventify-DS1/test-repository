from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth.models import AnonymousUser
from .models import Usuario, Rol
from .serializer import UsuarioSerializer, RolSerializer
from rest_framework_simplejwt.tokens import RefreshToken


class RolViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar roles del sistema.
    - Permite listar, crear, actualizar y eliminar roles.
    """
    queryset = Rol.objects.all()
    serializer_class = RolSerializer
    #permission_classes = [IsAuthenticated]  # Solo usuarios autenticados pueden modificar roles

    filterset_fields = ['nombre']

    # Buscar roles por nombre (coincidencia parcial)
    search_fields = ['nombre']

    # Ordenar resultados
    ordering_fields = ['nombre']
    ordering = ['nombre']

class UsuarioViewSet(viewsets.ModelViewSet):
    """
    ViewSet para el modelo Usuario.
    Permite registrar nuevos usuarios y gestionar sus datos.
    """

    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer

    filterset_fields = ['rol', 'estado_cuenta', 'facultad', 'carrera']

    # Buscar por nombre, username o email
    search_fields = ['username', 'first_name', 'last_name', 'email']

    # Ordenar por username, fecha de creación o nombre
    ordering_fields = ['username', 'first_name', 'last_name', 'email']
    ordering = ['username']

    
    """
    def get_permissions(self):
        
            Define permisos según la acción:
            - create: abierto (registro de nuevos usuarios)
            - demás acciones: requiere autenticación
        
            if self.action == 'create':
                return [AllowAny()]
            return [IsAuthenticated()]
    """
    

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
            secure=True,
            samesite='None' # Ya que el front y el back están en dominios diferentes
        )
        
        response.set_cookie(
            key='refresh',
            value=str(refresh),
            httponly=True,
            secure=True,
            samesite='None'
        )
        
        return response

