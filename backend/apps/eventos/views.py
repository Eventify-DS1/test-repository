from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework import serializers
from django.utils import timezone 
from .models import Evento, CategoriaEvento, Inscripcion, Reseña
from .serializer import EventoSerializer, CategoriaEventoSerializer, InscripcionSerializer, InscripcionDetalleSerializer, EstadisticasEventosSerializer, EstadisticasCategoriasSerializer, ReseñaSerializer
from .tasks import send_email_task

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
        # El serializer ya asigna el organizador en su método create(),
        # pero lo hacemos explícito aquí por si acaso
        event = serializer.save()
        # Enviar email de confirmación de forma asíncrona
        try:
            send_email_task.delay(event.id, f"Evento {event.titulo} creado correctamente", self.request.user.email)
        except Exception as e:
            # Si falla el envío del email, no debe impedir la creación del evento
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error al enviar email de confirmación: {str(e)}")


    def create(self, request, *args, **kwargs):
        """
        Personaliza la respuesta tras crear un evento.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        # Obtener el objeto creado para serializarlo de nuevo con todos los campos
        instance = serializer.instance
        
        # Serializar el objeto completo después de guardarlo
        response_serializer = self.get_serializer(instance)
        headers = self.get_success_headers(response_serializer.data)
        
        return Response(
            {
                "message": "Evento creado correctamente.",
                "evento": response_serializer.data
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
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated], url_path='confirmar-por-codigo')
    def confirmar_asistencia_por_codigo(self, request):
        """
        Confirma la asistencia usando solo el código de confirmación.
        El backend busca automáticamente a qué evento pertenece el código.
        """
        codigo = request.data.get('codigo', '').strip().upper()
        
        if not codigo:
            return Response(
                {'error': 'Debes proporcionar un código de confirmación.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Buscar el evento por código
        try:
            evento = Evento.objects.get(codigo_confirmacion__iexact=codigo)
        except Evento.DoesNotExist:
            return Response(
                {'error': 'Código de confirmación no válido. Verifica el código e intenta nuevamente.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Verificar si el usuario está inscrito
        try:
            inscripcion = Inscripcion.objects.get(
                usuario=request.user,
                evento=evento
            )
        except Inscripcion.DoesNotExist:
            return Response(
                {
                    'error': f'No estás inscrito en el evento "{evento.titulo}".',
                    'evento_titulo': evento.titulo
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verificar si ya está confirmado
        if inscripcion.asistencia_confirmada:
            from django.utils import timezone
            return Response(
                {
                    'message': 'Tu asistencia ya estaba confirmada.',
                    'evento_titulo': evento.titulo,
                    'fecha_confirmacion': inscripcion.fecha_confirmacion.isoformat() if inscripcion.fecha_confirmacion else None
                },
                status=status.HTTP_200_OK
            )
        
        # Confirmar asistencia
        from django.utils import timezone
        inscripcion.asistencia_confirmada = True
        inscripcion.fecha_confirmacion = timezone.now()
        inscripcion.save()
        
        serializer = InscripcionDetalleSerializer(inscripcion)
        return Response(
            {
                'message': f'¡Asistencia confirmada exitosamente para "{evento.titulo}"!',
                'evento_titulo': evento.titulo,
                'inscripcion': serializer.data
            },
            status=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def eventos_populares(self, request):
        """
        Retorna los eventos más populares (con más inscritos).
        Ordenados por número de inscritos descendente.
        """
        # Obtener todos los eventos
        eventos = Evento.objects.all()
        
        # Ordenar por número de inscritos (descendente)
        eventos_ordenados = sorted(
            eventos,
            key=lambda e: e.inscripciones.count(),
            reverse=True
        )
        
        # Tomar solo los primeros 3
        eventos_populares = eventos_ordenados[:3]
        
        serializer = self.get_serializer(eventos_populares, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def eventos_proximos_inscritos(self, request):
        """
        Retorna los eventos próximos donde el usuario está inscrito.
        Eventos donde fecha_inicio >= hoy y el usuario está inscrito.
        """
        from django.utils import timezone
        ahora = timezone.now()
        
        # Obtener IDs de eventos donde el usuario está inscrito
        inscripciones = Inscripcion.objects.filter(
            usuario=request.user
        ).select_related('evento')
        
        # Filtrar eventos próximos (fecha_inicio >= ahora)
        eventos_proximos = [
            inscripcion.evento for inscripcion in inscripciones
            if inscripcion.evento.fecha_inicio >= ahora
        ]
        
        # Ordenar por fecha_inicio (más próximos primero)
        eventos_proximos.sort(key=lambda e: e.fecha_inicio)
        
        serializer = self.get_serializer(eventos_proximos, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def eventos_asistidos(self, request):
        """
        Retorna los eventos asistidos por el usuario.
        Eventos donde fecha_fin < hoy y asistencia_confirmada = True.
        """
        from django.utils import timezone
        ahora = timezone.now()
        
        # Obtener inscripciones confirmadas del usuario
        inscripciones_confirmadas = Inscripcion.objects.filter(
            usuario=request.user,
            asistencia_confirmada=True
        ).select_related('evento')
        
        # Filtrar eventos finalizados (fecha_fin < ahora)
        eventos_asistidos = [
            inscripcion.evento for inscripcion in inscripciones_confirmadas
            if inscripcion.evento.fecha_fin < ahora
        ]
        
        # Ordenar por fecha_fin (más recientes primero)
        eventos_asistidos.sort(key=lambda e: e.fecha_fin, reverse=True)
        
        serializer = self.get_serializer(eventos_asistidos, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
        
    
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


class ReseñaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para el modelo Reseña.
    - Los usuarios pueden crear reseñas para eventos finalizados donde asistieron
    - Cualquiera puede ver las reseñas (list, retrieve)
    - Solo el autor puede editar/eliminar su reseña
    """
    serializer_class = ReseñaSerializer
    permission_classes = [IsAuthenticated]
    
    # Filtros
    filterset_fields = ['evento', 'usuario', 'puntuacion']
    ordering_fields = ['fecha', 'puntuacion']
    ordering = ['-fecha']  # Más recientes primero
    
    def get_queryset(self):
        """
        Filtra las reseñas según el contexto:
        - Si se pasa ?evento=id, muestra solo reseñas de ese evento
        - Si se pasa ?mis_reseñas=true, muestra solo las del usuario autenticado
        """
        queryset = Reseña.objects.select_related('evento', 'usuario').all()
        
        evento_id = self.request.query_params.get('evento', None)
        if evento_id:
            queryset = queryset.filter(evento_id=evento_id)
        
        mis_reseñas = self.request.query_params.get('mis_reseñas', None)
        if mis_reseñas == 'true':
            queryset = queryset.filter(usuario=self.request.user)
        
        return queryset
    
    def get_permissions(self):
        """
        Permisos:
        - list, retrieve: Cualquiera puede ver (AllowAny)
        - create, update, destroy: Requiere autenticación
        """
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]
    
    def perform_create(self, serializer):
        """Asigna automáticamente el usuario autenticado"""
        serializer.save(usuario=self.request.user)
    
    def perform_update(self, serializer):
        """Solo permite actualizar si es el autor"""
        if serializer.instance.usuario != self.request.user:
            raise serializers.ValidationError(
                "No tienes permiso para editar esta reseña."
            )
        serializer.save()
    
    def perform_destroy(self, instance):
        """Solo permite eliminar si es el autor"""
        if instance.usuario != self.request.user:
            raise serializers.ValidationError(
                "No tienes permiso para eliminar esta reseña."
            )
        instance.delete()
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def eventos_calificables(self, request):
        """
        Retorna los eventos finalizados donde el usuario asistió (confirmó asistencia)
        y aún no ha calificado.
        """
        # Eventos donde el usuario está inscrito Y confirmó asistencia
        inscripciones = Inscripcion.objects.filter(
            usuario=request.user,
            asistencia_confirmada=True
        )
        eventos_inscritos = [insc.evento for insc in inscripciones]
        
        # Filtrar eventos finalizados
        eventos_finalizados = [
            evento for evento in eventos_inscritos 
            if evento.fecha_fin < timezone.now()
        ]
        
        # Filtrar eventos que ya tienen reseña del usuario
        reseñas_existentes = Reseña.objects.filter(
            usuario=request.user
        ).values_list('evento_id', flat=True)
        
        eventos_calificables = [
            evento for evento in eventos_finalizados
            if evento.id not in reseñas_existentes
        ]
        
        # Serializar los eventos
        serializer = EventoSerializer(eventos_calificables, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'], permission_classes=[AllowAny])
    def promedio_calificacion(self, request, pk=None):
        """
        Retorna el promedio de calificaciones de un evento.
        pk es el ID del evento, no de la reseña.
        """
        from django.db.models import Avg
        
        evento_id = pk
        promedio = Reseña.objects.filter(
            evento_id=evento_id
        ).aggregate(promedio=Avg('puntuacion'))['promedio']
        
        total_reseñas = Reseña.objects.filter(evento_id=evento_id).count()
        
        return Response({
            'evento_id': evento_id,
            'promedio': round(promedio, 2) if promedio else 0,
            'total_reseñas': total_reseñas
        })