from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework import serializers
from .models import Evento, CategoriaEvento, Inscripcion
from .serializer import EventoSerializer, CategoriaEventoSerializer, InscripcionSerializer, InscripcionDetalleSerializer, EstadisticasEventosSerializer, EstadisticasCategoriasSerializer


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
    
    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def esta_inscrito(self, request, pk=None):
        """
        Verifica si el usuario autenticado está inscrito en este evento.
        También retorna si la asistencia está confirmada.
        """
        evento = self.get_object()
        try:
            inscripcion = Inscripcion.objects.get(
                usuario=request.user,
                evento=evento
            )
            return Response({
                'esta_inscrito': True,
                'asistencia_confirmada': inscripcion.asistencia_confirmada,
                'evento_id': evento.id
            })
        except Inscripcion.DoesNotExist:
            return Response({
                'esta_inscrito': False,
                'asistencia_confirmada': False,
                'evento_id': evento.id
            })
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def inscribirse(self, request, pk=None):
        """
        Inscribe al usuario autenticado en este evento.
        """
        evento = self.get_object()
        
        # Verificar si ya está inscrito
        if Inscripcion.objects.filter(usuario=request.user, evento=evento).exists():
            return Response(
                {'error': 'Ya estás inscrito en este evento.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verificar si hay cupos disponibles
        if not evento.tiene_cupos_disponibles():
            return Response(
                {'error': 'No hay cupos disponibles para este evento.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Crear la inscripción
        inscripcion = Inscripcion.objects.create(
            usuario=request.user,
            evento=evento
        )
        
        serializer = InscripcionDetalleSerializer(inscripcion)
        return Response(
            {
                'message': 'Te has inscrito exitosamente en el evento.',
                'inscripcion': serializer.data
            },
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=True, methods=['delete'], permission_classes=[IsAuthenticated])
    def desinscribirse(self, request, pk=None):
        """
        Desinscribe al usuario autenticado de este evento.
        No permite desinscribirse si la asistencia ya está confirmada.
        """
        evento = self.get_object()
        
        try:
            inscripcion = Inscripcion.objects.get(
                usuario=request.user,
                evento=evento
            )
            
            # Verificar si la asistencia ya está confirmada
            if inscripcion.asistencia_confirmada:
                return Response(
                    {'error': 'No puedes desinscribirte porque tu asistencia ya está confirmada.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            inscripcion.delete()
            return Response(
                {'message': 'Te has desinscrito del evento.'},
                status=status.HTTP_200_OK
            )
        except Inscripcion.DoesNotExist:
            return Response(
                {'error': 'No estás inscrito en este evento.'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def confirmar_asistencia(self, request, pk=None):
        """
        Confirma la asistencia del usuario autenticado ingresando el código de confirmación.
        """
        evento = self.get_object()
        codigo = request.data.get('codigo', '').strip().upper()
        
        if not codigo:
            return Response(
                {'error': 'Debes proporcionar un código de confirmación.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verificar si el usuario está inscrito
        try:
            inscripcion = Inscripcion.objects.get(
                usuario=request.user,
                evento=evento
            )
        except Inscripcion.DoesNotExist:
            return Response(
                {'error': 'No estás inscrito en este evento.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verificar si ya está confirmado
        if inscripcion.asistencia_confirmada:
            return Response(
                {'error': 'Tu asistencia ya está confirmada.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verificar el código
        if evento.codigo_confirmacion.upper() != codigo:
            return Response(
                {'error': 'Código de confirmación incorrecto.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Confirmar asistencia
        from django.utils import timezone
        inscripcion.asistencia_confirmada = True
        inscripcion.fecha_confirmacion = timezone.now()
        inscripcion.save()
        
        serializer = InscripcionDetalleSerializer(inscripcion)
        return Response(
            {
                'message': '¡Asistencia confirmada exitosamente!',
                'inscripcion': serializer.data
            },
            status=status.HTTP_200_OK
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
        Valida que haya cupos disponibles.
        """
        evento = serializer.validated_data.get('evento')
        if evento and not evento.tiene_cupos_disponibles():
            raise serializers.ValidationError(
                {'evento': 'No hay cupos disponibles para este evento.'}
            )
        serializer.save(usuario=self.request.user)


