from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth.models import AnonymousUser
from .models import Usuario, Rol
from .serializer import UsuarioSerializer, RolSerializer


class RolViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar roles del sistema.
    - Permite listar, crear, actualizar y eliminar roles.
    """
    queryset = Rol.objects.all()
    serializer_class = RolSerializer
    #permission_classes = [IsAuthenticated]  # Solo usuarios autenticados pueden modificar roles


class UsuarioViewSet(viewsets.ModelViewSet):
    """
    ViewSet para el modelo Usuario.
    Permite registrar nuevos usuarios y gestionar sus datos.
    """

    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer

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
        headers = self.get_success_headers(serializer.data)
        return Response(
            {
                "message": "Usuario registrado correctamente.",
                "usuario": serializer.data
            },
            status=status.HTTP_201_CREATED,
            headers=headers
        )

