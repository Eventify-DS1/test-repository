from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from .models import Evento, CategoriaEvento
from .serializer import EventoSerializer, CategoriaEventoSerializer


class CategoriaEventoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para categorías de eventos.
    Permite CRUD completo sobre las categorías.
    """
    queryset = CategoriaEvento.objects.all()
    serializer_class = CategoriaEventoSerializer
    permission_classes = [IsAuthenticated]


class EventoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para el modelo Evento.
    - Solo usuarios autenticados pueden crear eventos.
    - El organizador se asigna automáticamente en perform_create().
    """
    queryset = Evento.objects.all()
    serializer_class = EventoSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        """
        Asigna automáticamente el organizador (usuario autenticado)
        antes de guardar el evento.
        """
        serializer.save(organizador=self.request.user)

    def create(self, request, *args, **kwargs):
        """
        Personaliza la respuesta tras crear un evento.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            {
                "message": "Evento creado correctamente.",
                "evento": serializer.data
            },
            status=status.HTTP_201_CREATED,
            headers=headers
        )
