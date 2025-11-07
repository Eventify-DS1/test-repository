from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Evento, CategoriaEvento, Inscripcion
from .serializer import EventoSerializer, CategoriaEventoSerializer, InscripcionSerializer, InscripcionDetalleSerializer, EstadisticasEventosSerializer, EstadisticasCategoriasSerializer
from rest_framework.decorators import action
from .serializer import EventoSerializer, CategoriaEventoSerializer, InscripcionSerializer, InscripcionDetalleSerializer


class CategoriaEventoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para categorías de eventos.
    Permite CRUD completo sobre las categorías.
    """
    queryset = CategoriaEvento.objects.all()
    serializer_class = CategoriaEventoSerializer
    permission_classes = [IsAuthenticated]

    search_fields = ['nombre']
    ordering_fields = ['nombre']
    ordering = ['nombre']

    def get_permissions(self):
        """
        Permisos personalizados:
        - list, retrieve, count_categories, estadisticas: cualquiera puede ver (AllowAny)
        - create, update, destroy: solo usuarios autenticados
        """
        if self.action in ['list', 'retrieve', 'count_categories', 'estadisticas']:
            return [AllowAny()]
        return [IsAuthenticated()]

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def count_categories(self, request):
        """Retorna el total de categorías disponibles."""
        total = CategoriaEvento.objects.count()
        return Response({'total': total})

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def estadisticas(self, request):
        """
        Endpoint para obtener estadísticas de categorías.
        Accesible públicamente sin autenticación.
        """
        # Crear una instancia ficticia para el serializer
        categoria = CategoriaEvento.objects.first() if CategoriaEvento.objects.exists() else None
        
        serializer = EstadisticasCategoriasSerializer(categoria)
        return Response(serializer.data, status=status.HTTP_200_OK)
    

class EventoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para el modelo Evento.
    - Cualquier persona puede ver eventos (list, retrieve)
    - Solo usuarios autenticados pueden crear/editar/eliminar eventos
    """
    queryset = Evento.objects.all()
    serializer_class = EventoSerializer

    # 🔍 Búsqueda textual
    search_fields = ['titulo', 'descripcion', 'ubicacion', 'categoria__nombre']

    # ⚙️ Filtros exactos (por valores específicos)
    filterset_fields = ['categoria', 'organizador', 'fecha_inicio', 'fecha_fin']

    # 🔢 Ordenamiento
    ordering_fields = ['fecha_inicio', 'fecha_fin', 'titulo', 'aforo']
    ordering = ['fecha_inicio']  # Orden por defecto (por fecha de inicio)

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def estadisticas(self, request):
        """
        Endpoint para obtener estadísticas de eventos.
        Accesible públicamente sin autenticación.
        """
        evento = Evento.objects.first() if Evento.objects.exists() else None
        serializer = EstadisticasEventosSerializer(evento)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def get_permissions(self):
        """
        Define permisos según la acción:
        - list, retrieve, estadisticas: Abierto para cualquiera.
        - create, update, destroy: Permisos por defecto (requiere autenticación).
        """
        if self.action in ['list', 'retrieve', 'estadisticas']:
            return [AllowAny()]
        # Para create, update, destroy se usan los permisos por defecto
        return [IsAuthenticated()] 

    


    def perform_create(self, serializer):  
        #Asigna automáticamente el organizador (usuario autenticado)
        #antes de guardar el evento.
        serializer.save(organizador=self.request.user)


    def create(self, request, *args, **kwargs):
        
       # Personaliza la respuesta tras crear un evento.
        
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
        
    
class InscripcionViewSet(viewsets.ModelViewSet):
    """
    ViewSet para el modelo Inscripcion.
    - Solo usuarios autenticados pueden inscribirse en eventos.
    - Se valida que no haya inscripciones duplicadas.
    """
    queryset = Inscripcion.objects.all()
    permission_classes = [IsAuthenticated]

    # 🔍 Búsqueda y filtros
    search_fields = ['usuario__nombre', 'evento__titulo']
    filterset_fields = ['usuario', 'evento']
    ordering_fields = ['fecha_inscripcion']
    ordering = ['-fecha_inscripcion']  # Más recientes primero

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return InscripcionDetalleSerializer
        return InscripcionSerializer

    def perform_create(self, serializer):
        """
        Asigna automáticamente el usuario autenticado
        antes de guardar la inscripción.
        """
        serializer.save(usuario=self.request.user)


