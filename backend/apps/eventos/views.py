from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework import serializers
from django.utils import timezone
from django.db import models
from .models import Evento, CategoriaEvento, Inscripcion, Reseña
from .serializer import EventoSerializer, CategoriaEventoSerializer, InscripcionSerializer, InscripcionDetalleSerializer, EstadisticasEventosSerializer, EstadisticasCategoriasSerializer, ReseñaSerializer
from .tasks import send_email_task, send_message_to_inscritos
from apps.notificaciones.tasks import notificar_cambio_evento, notificar_eliminacion_evento

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

    def get_queryset(self):
        """
        Permite filtrar eventos por fecha_fin y fecha_inicio usando operadores __gt, __lte, __gte
        """
        queryset = super().get_queryset()
        
        # Filtrar eventos futuros (fecha_fin > ahora)
        fecha_fin_gt = self.request.query_params.get('fecha_fin__gt')
        if fecha_fin_gt:
            from django.utils import timezone
            try:
                # Si es una fecha ISO string, convertirla
                if isinstance(fecha_fin_gt, str):
                    from datetime import datetime
                    fecha = datetime.fromisoformat(fecha_fin_gt.replace('Z', '+00:00'))
                    queryset = queryset.filter(fecha_fin__gt=fecha)
                else:
                    queryset = queryset.filter(fecha_fin__gt=fecha_fin_gt)
            except (ValueError, TypeError):
                pass  # Ignorar si el formato es inválido
        
        # Filtrar eventos pasados (fecha_fin <= ahora)
        fecha_fin_lte = self.request.query_params.get('fecha_fin__lte')
        if fecha_fin_lte:
            from django.utils import timezone
            try:
                # Si es una fecha ISO string, convertirla
                if isinstance(fecha_fin_lte, str):
                    from datetime import datetime
                    fecha = datetime.fromisoformat(fecha_fin_lte.replace('Z', '+00:00'))
                    queryset = queryset.filter(fecha_fin__lte=fecha)
                else:
                    queryset = queryset.filter(fecha_fin__lte=fecha_fin_lte)
            except (ValueError, TypeError):
                pass  # Ignorar si el formato es inválido
        
        # Filtrar por fecha_inicio >= fecha específica
        fecha_inicio_gte = self.request.query_params.get('fecha_inicio__gte')
        if fecha_inicio_gte:
            try:
                if isinstance(fecha_inicio_gte, str):
                    from datetime import datetime
                    fecha = datetime.fromisoformat(fecha_inicio_gte.replace('Z', '+00:00'))
                    queryset = queryset.filter(fecha_inicio__gte=fecha)
                else:
                    queryset = queryset.filter(fecha_inicio__gte=fecha_inicio_gte)
            except (ValueError, TypeError):
                pass
        
        # Filtrar por fecha_inicio <= fecha específica
        fecha_inicio_lte = self.request.query_params.get('fecha_inicio__lte')
        if fecha_inicio_lte:
            try:
                if isinstance(fecha_inicio_lte, str):
                    from datetime import datetime
                    fecha = datetime.fromisoformat(fecha_inicio_lte.replace('Z', '+00:00'))
                    queryset = queryset.filter(fecha_inicio__lte=fecha)
                else:
                    queryset = queryset.filter(fecha_inicio__lte=fecha_inicio_lte)
            except (ValueError, TypeError):
                pass
        
        # Filtrar por inscripción del usuario autenticado
        if self.request.user.is_authenticated:
            inscrito = self.request.query_params.get('inscrito')
            if inscrito is not None:
                # Obtener IDs de eventos donde el usuario está inscrito
                inscripciones = Inscripcion.objects.filter(
                    usuario=self.request.user
                ).values_list('evento_id', flat=True)
                
                if inscrito.lower() == 'true' or inscrito == '1':
                    # Solo eventos donde el usuario está inscrito
                    queryset = queryset.filter(id__in=inscripciones)
                elif inscrito.lower() == 'false' or inscrito == '0':
                    # Solo eventos donde el usuario NO está inscrito
                    queryset = queryset.exclude(id__in=inscripciones)
        
        return queryset

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
        - list, retrieve, estadisticas, eventos_populares: Abierto para cualquiera.
        - create, update, destroy: Permisos por defecto (requiere autenticación).
        """
        if self.action in ['list', 'retrieve', 'estadisticas', 'eventos_populares']:
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

    def perform_update(self, serializer):
        """
        Detecta cambios en ubicacion, fecha_inicio o fecha_fin y notifica a los participantes.
        Funciona tanto con PUT (actualización completa) como con PATCH (actualización parcial).
        """
        import logging
        logger = logging.getLogger(__name__)
        
        # Obtener la instancia antes de guardar para comparar valores
        instance = serializer.instance
        logger.info(f"🔄 [UPDATE] Iniciando actualización del evento ID: {instance.id}, Título: {instance.titulo}")
        
        # Guardar valores anteriores ANTES de guardar
        ubicacion_anterior = instance.ubicacion
        fecha_inicio_anterior = instance.fecha_inicio
        fecha_fin_anterior = instance.fecha_fin
        
        logger.debug(f"📋 [UPDATE] Valores anteriores - Ubicación: {ubicacion_anterior}, Fecha inicio: {fecha_inicio_anterior}, Fecha fin: {fecha_fin_anterior}")
        
        # Guardar el evento actualizado
        evento_actualizado = serializer.save()
        
        # Refrescar desde BD para obtener valores finales
        evento_actualizado.refresh_from_db()
        
        logger.debug(f"📋 [UPDATE] Valores nuevos - Ubicación: {evento_actualizado.ubicacion}, Fecha inicio: {evento_actualizado.fecha_inicio}, Fecha fin: {evento_actualizado.fecha_fin}")
        
        # Detectar cambios comparando valores anteriores con los nuevos
        campos_cambiados = []
        
        # Verificar cambio de ubicación
        if evento_actualizado.ubicacion != ubicacion_anterior:
            logger.info(f"📍 [UPDATE] Cambio detectado en UBICACIÓN: '{ubicacion_anterior}' → '{evento_actualizado.ubicacion}'")
            campos_cambiados.append({
                'campo': 'ubicacion',
                'valor_anterior': ubicacion_anterior,
                'valor_nuevo': evento_actualizado.ubicacion
            })
        
        # Verificar cambio de fecha_inicio
        if evento_actualizado.fecha_inicio != fecha_inicio_anterior:
            logger.info(f"📅 [UPDATE] Cambio detectado en FECHA_INICIO: '{fecha_inicio_anterior}' → '{evento_actualizado.fecha_inicio}'")
            campos_cambiados.append({
                'campo': 'fecha_inicio',
                'valor_anterior': fecha_inicio_anterior.strftime('%d/%m/%Y %H:%M') if fecha_inicio_anterior else None,
                'valor_nuevo': evento_actualizado.fecha_inicio.strftime('%d/%m/%Y %H:%M') if evento_actualizado.fecha_inicio else None
            })
        
        # Verificar cambio de fecha_fin
        if evento_actualizado.fecha_fin != fecha_fin_anterior:
            logger.info(f"📅 [UPDATE] Cambio detectado en FECHA_FIN: '{fecha_fin_anterior}' → '{evento_actualizado.fecha_fin}'")
            campos_cambiados.append({
                'campo': 'fecha_fin',
                'valor_anterior': fecha_fin_anterior.strftime('%d/%m/%Y %H:%M') if fecha_fin_anterior else None,
                'valor_nuevo': evento_actualizado.fecha_fin.strftime('%d/%m/%Y %H:%M') if evento_actualizado.fecha_fin else None
            })
        
        if not campos_cambiados:
            logger.info(f"ℹ️  [UPDATE] No se detectaron cambios en ubicación, fecha_inicio o fecha_fin para el evento {evento_actualizado.id}")
        else:
            logger.info(f"🔔 [UPDATE] Se detectaron {len(campos_cambiados)} cambio(s). Enviando notificaciones...")
        
        # Obtener parámetro enviar_correo del request (por defecto False)
        enviar_correo = self.request.data.get('enviar_correo', False)
        if isinstance(enviar_correo, str):
            enviar_correo = enviar_correo.lower() in ('true', '1', 'yes')
        
        # Enviar notificaciones para cada campo cambiado
        for cambio in campos_cambiados:
            try:
                logger.info(f"📤 [UPDATE] Enviando tarea Celery para notificar cambio de '{cambio['campo']}' en evento {evento_actualizado.id}, enviar_correo: {enviar_correo}")
                notificar_cambio_evento.delay(
                    evento_actualizado.id,
                    cambio['campo'],
                    cambio['valor_anterior'],
                    cambio['valor_nuevo'],
                    enviar_correo
                )
                logger.info(f"✅ [UPDATE] Tarea Celery enviada exitosamente para cambio de '{cambio['campo']}'")
            except Exception as e:
                # Si falla Celery, intentar notificar de forma síncrona
                logger.error(f"❌ [UPDATE] Error al enviar tarea Celery para cambio de {cambio['campo']} en evento {evento_actualizado.id}: {str(e)}")
                import traceback
                logger.error(traceback.format_exc())
                try:
                    resultado_sync = notificar_cambio_evento(
                        evento_actualizado.id,
                        cambio['campo'],
                        cambio['valor_anterior'],
                        cambio['valor_nuevo'],
                        enviar_correo
                    )
                    logger.info(f"✅ [UPDATE] Notificación síncrona ejecutada: {resultado_sync}")
                except Exception as e_sync:
                    logger.error(f"❌ [UPDATE] Error en notificación síncrona para cambio de {cambio['campo']}: {str(e_sync)}")
                    import traceback
                    logger.error(traceback.format_exc())

    def perform_destroy(self, instance):
        """
        Notifica a organizador y participantes cuando se elimina un evento.
        Envía la tarea Celery antes de borrar el evento para conservar la data.
        """
        import logging
        logger = logging.getLogger(__name__)

        logger.info(f"🗑️ [DELETE] Solicitando eliminación del evento ID: {instance.id}, Título: {instance.titulo}")

        # Validar que solo el organizador pueda eliminar
        if instance.organizador != self.request.user:
            raise serializers.ValidationError("No tienes permiso para eliminar este evento.")

        # Capturar datos antes de borrar
        participantes_ids = list(instance.inscripciones.values_list('usuario_id', flat=True))
        organizador_id = instance.organizador_id
        evento_id = instance.id
        titulo_evento = instance.titulo

        # Obtener parámetro enviar_correo del request (por defecto False)
        enviar_correo = self.request.data.get('enviar_correo', False)
        if isinstance(enviar_correo, str):
            enviar_correo = enviar_correo.lower() in ('true', '1', 'yes')

        try:
            logger.info(f"🚀 [DELETE] Enviando tarea Celery para notificar eliminación de evento, enviar_correo: {enviar_correo}")
            
            resultado = notificar_eliminacion_evento.delay(
                evento_id,
                titulo_evento,
                organizador_id,
                participantes_ids,
                enviar_correo
            )
            
            logger.info(f"✅ [DELETE] Tarea Celery enviada exitosamente. Task ID: {resultado.id}")
        except Exception as e:
            logger.error(f"❌ [DELETE] Error al enviar tarea Celery de eliminación: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            
            # FALLBACK: Ejecutar notificación de forma síncrona si Celery falla
            try:
                resultado_sync = notificar_eliminacion_evento(
                    evento_id,
                    titulo_evento,
                    organizador_id,
                    participantes_ids,
                    enviar_correo
                )
                logger.info(f"✅ [DELETE] Notificación síncrona ejecutada exitosamente: {resultado_sync}")
            except Exception as e_sync:
                logger.error(f"❌ [DELETE] Error en notificación síncrona: {str(e_sync)}")
                import traceback
                logger.error(traceback.format_exc())
            
            # Continuar con la eliminación aunque falle la notificación

        # Finalmente eliminar el evento
        instance.delete()
        logger.info(f"✅ [DELETE] Evento eliminado de la base de datos")

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
        ahora = timezone.now()
        eventos = Evento.objects.filter(fecha_fin__gt=ahora)
        
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
    def eventos_inscritos(self, request):
        """
        Retorna los eventos donde el usuario está inscrito que aún no han finalizado.
        Eventos donde fecha_fin >= ahora.
        """
        from django.utils import timezone
        ahora = timezone.now()
        
        # Obtener eventos donde el usuario está inscrito y que aún no han finalizado
        inscripciones = Inscripcion.objects.filter(
            usuario=request.user,
            evento__fecha_fin__gte=ahora
        ).select_related('evento').order_by('evento__fecha_inicio')
        
        eventos_inscritos = [inscripcion.evento for inscripcion in inscripciones]
        
        serializer = self.get_serializer(eventos_inscritos, many=True)
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
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def eventos_creados(self, request):
        """
        Retorna los eventos creados por el usuario autenticado (donde es organizador)
        que aún no han finalizado. Eventos donde fecha_fin >= ahora.
        """
        from django.utils import timezone
        ahora = timezone.now()
        
        # Obtener eventos donde el usuario es organizador y que aún no han finalizado
        eventos_creados = Evento.objects.filter(
            organizador=request.user,
            fecha_fin__gte=ahora
        ).order_by('fecha_inicio')
        
        serializer = self.get_serializer(eventos_creados, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def eventos_pasados_inscritos(self, request):
        """
        Retorna los eventos pasados donde el usuario está inscrito.
        Eventos donde fecha_fin < hoy y el usuario está inscrito.
        """
        from django.utils import timezone
        ahora = timezone.now()
        
        # Obtener eventos donde el usuario está inscrito y ya finalizaron
        inscripciones = Inscripcion.objects.filter(
            usuario=request.user
        ).select_related('evento')
        
        eventos_pasados = [
            inscripcion.evento for inscripcion in inscripciones
            if inscripcion.evento.fecha_fin < ahora
        ]
        
        # Ordenar por fecha_fin (más recientes primero)
        eventos_pasados.sort(key=lambda e: e.fecha_fin, reverse=True)
        
        serializer = self.get_serializer(eventos_pasados, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def eventos_futuros_por_usuario(self, request):
        """
        Retorna los eventos futuros creados por un usuario específico.
        Accesible públicamente.
        Parámetros: user_id (query param)
        """
        from django.utils import timezone
        from apps.usuarios.models import Usuario
        
        ahora = timezone.now()
        user_id = request.query_params.get('user_id')
        
        if not user_id:
            return Response(
                {'detail': 'Se requiere el parámetro user_id'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            usuario = Usuario.objects.get(id=user_id)
        except Usuario.DoesNotExist:
            return Response(
                {'detail': 'Usuario no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Obtener eventos futuros creados por el usuario
        eventos = Evento.objects.filter(
            organizador=usuario,
            fecha_fin__gte=ahora
        ).order_by('fecha_inicio')
        
        serializer = self.get_serializer(eventos, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def eventos_compartidos_inscritos(self, request):
        """
        Retorna los eventos donde tanto el usuario autenticado como otro usuario están inscritos.
        Parámetros: user_id (query param) - ID del otro usuario
        """
        from django.utils import timezone
        from apps.usuarios.models import Usuario
        
        ahora = timezone.now()
        user_id = request.query_params.get('user_id')
        
        if not user_id:
            return Response(
                {'detail': 'Se requiere el parámetro user_id'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            otro_usuario = Usuario.objects.get(id=user_id)
        except Usuario.DoesNotExist:
            return Response(
                {'detail': 'Usuario no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Obtener eventos donde ambos están inscritos y aún no han finalizado
        inscripciones_usuario_actual = Inscripcion.objects.filter(
            usuario=request.user
        ).values_list('evento_id', flat=True)
        
        inscripciones_otro_usuario = Inscripcion.objects.filter(
            usuario=otro_usuario
        ).values_list('evento_id', flat=True)
        
        # Eventos donde ambos están inscritos
        eventos_compartidos_ids = set(inscripciones_usuario_actual) & set(inscripciones_otro_usuario)
        
        # Filtrar eventos futuros
        eventos_compartidos = Evento.objects.filter(
            id__in=eventos_compartidos_ids,
            fecha_fin__gte=ahora
        ).order_by('fecha_inicio')
        
        serializer = self.get_serializer(eventos_compartidos, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def eventos_compartidos_asistidos(self, request):
        """
        Retorna los eventos pasados donde tanto el usuario autenticado como otro usuario asistieron.
        Parámetros: user_id (query param) - ID del otro usuario
        """
        from django.utils import timezone
        from apps.usuarios.models import Usuario
        
        ahora = timezone.now()
        user_id = request.query_params.get('user_id')
        
        if not user_id:
            return Response(
                {'detail': 'Se requiere el parámetro user_id'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            otro_usuario = Usuario.objects.get(id=user_id)
        except Usuario.DoesNotExist:
            return Response(
                {'detail': 'Usuario no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Obtener eventos donde ambos confirmaron asistencia
        inscripciones_usuario_actual = Inscripcion.objects.filter(
            usuario=request.user,
            asistencia_confirmada=True
        ).values_list('evento_id', flat=True)
        
        inscripciones_otro_usuario = Inscripcion.objects.filter(
            usuario=otro_usuario,
            asistencia_confirmada=True
        ).values_list('evento_id', flat=True)
        
        # Eventos donde ambos asistieron
        eventos_compartidos_ids = set(inscripciones_usuario_actual) & set(inscripciones_otro_usuario)
        
        # Filtrar eventos pasados
        eventos_compartidos = Evento.objects.filter(
            id__in=eventos_compartidos_ids,
            fecha_fin__lt=ahora
        ).order_by('-fecha_fin')
        
        serializer = self.get_serializer(eventos_compartidos, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def eventos_pasados_creados(self, request):
        """
        Retorna los eventos pasados creados por el usuario autenticado (donde es organizador).
        Eventos donde fecha_fin < hoy.
        """
        from django.utils import timezone
        ahora = timezone.now()
        
        # Obtener eventos pasados donde el usuario es organizador
        eventos_pasados = Evento.objects.filter(
            organizador=request.user,
            fecha_fin__lt=ahora
        ).order_by('-fecha_fin')
        
        serializer = self.get_serializer(eventos_pasados, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post', 'delete'], permission_classes=[IsAuthenticated])
    def toggle_favorito(self, request, pk=None):
        """
        Marca o desmarca un evento como favorito.
        POST: marca como favorito
        DELETE: desmarca como favorito
        """
        from .models import Favorito
        
        evento = self.get_object()
        
        if request.method == 'POST':
            # Marcar como favorito
            favorito, created = Favorito.objects.get_or_create(
                usuario=request.user,
                evento=evento
            )
            if created:
                return Response(
                    {'message': 'Evento agregado a favoritos', 'is_favorito': True},
                    status=status.HTTP_201_CREATED
                )
            else:
                return Response(
                    {'message': 'El evento ya está en favoritos', 'is_favorito': True},
                    status=status.HTTP_200_OK
                )
        else:
            # DELETE: Desmarcar como favorito
            try:
                favorito = Favorito.objects.get(usuario=request.user, evento=evento)
                favorito.delete()
                return Response(
                    {'message': 'Evento eliminado de favoritos', 'is_favorito': False},
                    status=status.HTTP_200_OK
                )
            except Favorito.DoesNotExist:
                return Response(
                    {'message': 'El evento no está en favoritos', 'is_favorito': False},
                    status=status.HTTP_200_OK
                )
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def eventos_favoritos(self, request):
        """
        Retorna los eventos marcados como favoritos por el usuario autenticado
        que aún no han finalizado.
        """
        from django.utils import timezone
        from .models import Favorito
        
        ahora = timezone.now()
        
        # Obtener eventos favoritos que aún no han finalizado
        favoritos = Favorito.objects.filter(
            usuario=request.user,
            evento__fecha_fin__gte=ahora
        ).select_related('evento').order_by('evento__fecha_inicio')
        
        eventos_favoritos = [favorito.evento for favorito in favoritos]
        
        # Pasar el request en el contexto para que get_is_favorito funcione correctamente
        serializer = self.get_serializer(eventos_favoritos, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def enviar_mensaje_inscritos(self, request, pk=None):
        """
        Permite al organizador del evento enviar un mensaje por email a todos los inscritos.
        Solo el organizador del evento puede usar este endpoint.
        """
        evento = self.get_object()
        
        # Verificar que el usuario es el organizador o un admin
        if not (evento.organizador == request.user or request.user.is_staff):
            return Response(
                {'detail': 'Solo el organizador del evento puede enviar mensajes a los inscritos.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Validar datos del request
        subject = request.data.get('subject', '').strip()
        message = request.data.get('message', '').strip()
        
        if not subject:
            return Response(
                {'detail': 'El asunto del mensaje es obligatorio.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not message:
            return Response(
                {'detail': 'El contenido del mensaje es obligatorio.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verificar que hay inscritos
        inscripciones_count = Inscripcion.objects.filter(evento=evento).count()
        if inscripciones_count == 0:
            return Response(
                {'detail': 'No hay participantes inscritos en este evento.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Obtener nombre del organizador
        organizador_nombre = evento.organizador.get_full_name() or evento.organizador.username
        
        # Enviar emails de forma asíncrona usando Celery
        try:
            send_message_to_inscritos.delay(
                evento.id,
                subject,
                message,
                organizador_nombre
            )
            
            return Response(
                {
                    'message': f'El mensaje se está enviando a {inscripciones_count} participante(s).',
                    'total_inscritos': inscripciones_count
                },
                status=status.HTTP_200_OK
            )
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error al programar envío de mensajes para evento {evento.id}: {str(e)}")
            return Response(
                {'detail': 'Error al programar el envío de mensajes. Por favor, intenta de nuevo.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def reporte_organizador(self, request, pk=None):
        """ 
        Retorna un reporte detallado de asistencia para un evento específico.
        Solo accesible por el organizador del evento.
        """
        evento = self.get_object()
    
        # Verificar que el usuario es el organizador
        if evento.organizador != request.user:
            return Response(
                {'error': 'Solo el organizador puede ver este reporte.'},
                status=status.HTTP_403_FORBIDDEN
            )
    
        # Obtener todas las inscripciones
        inscripciones = evento.inscripciones.select_related('usuario').all()
    
        # Calcular estadísticas
        total_inscritos = inscripciones.count()
        confirmados = inscripciones.filter(asistencia_confirmada=True).count()
        pendientes = total_inscritos - confirmados
        porcentaje_confirmacion = (confirmados / total_inscritos * 100) if total_inscritos > 0 else 0
        cupos_disponibles = evento.aforo - total_inscritos
        porcentaje_ocupacion = (total_inscritos / evento.aforo * 100) if evento.aforo > 0 else 0
    
        # Obtener reseñas del evento
        from django.db.models import Avg
        reseñas = Reseña.objects.filter(evento=evento)
        promedio_calificacion = reseñas.aggregate(promedio=Avg('puntuacion'))['promedio'] or 0
        total_reseñas = reseñas.count()
    
        # Preparar lista de inscritos con detalles
        inscritos_detalle = []
        for inscripcion in inscripciones:
            usuario = inscripcion.usuario
            inscritos_detalle.append({
                'id': usuario.id,
                'username': usuario.username,
                'nombre_completo': f"{usuario.first_name} {usuario.last_name}".strip() or usuario.username,
                'email': usuario.email,
                'codigo_estudiantil': usuario.codigo_estudiantil,
                'fecha_inscripcion': inscripcion.fecha_inscripcion.isoformat(),
                'asistencia_confirmada': inscripcion.asistencia_confirmada,
                'fecha_confirmacion': inscripcion.fecha_confirmacion.isoformat() if inscripcion.fecha_confirmacion else None,
            })
    
        # Datos del evento
        evento_data = {
            'id': evento.id,
            'titulo': evento.titulo,
            'fecha_inicio': evento.fecha_inicio.isoformat(),
            'fecha_fin': evento.fecha_fin.isoformat(),
            'ubicacion': evento.ubicacion,
            'aforo': evento.aforo,
            'codigo_confirmacion': evento.codigo_confirmacion,
            'categoria': evento.categoria.nombre if evento.categoria else None,
        }
    
        return Response({
            'evento': evento_data,
            'estadisticas': {
                'total_inscritos': total_inscritos,
                'confirmados': confirmados,
                'pendientes': pendientes,
                'porcentaje_confirmacion': round(porcentaje_confirmacion, 2),
                'cupos_disponibles': cupos_disponibles,
                'porcentaje_ocupacion': round(porcentaje_ocupacion, 2),
                'promedio_calificacion': round(promedio_calificacion, 2) if promedio_calificacion else 0,
                'total_reseñas': total_reseñas,
            },
            'inscritos': inscritos_detalle,
        }, status=status.HTTP_200_OK)


    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def mis_eventos_reportes(self, request):
        """
        Retorna un resumen de reportes para todos los eventos creados por el usuario.
        Útil para mostrar una vista general en el frontend.
    """
        from django.db.models import Count, Q, Avg
    
        # Obtener eventos del organizador
        eventos = Evento.objects.filter(organizador=request.user)
    
        reportes = []
        for evento in eventos:
            total_inscritos = evento.inscripciones.count()
            confirmados = evento.inscripciones.filter(asistencia_confirmada=True).count()
            porcentaje_confirmacion = (confirmados / total_inscritos * 100) if total_inscritos > 0 else 0
            porcentaje_ocupacion = (total_inscritos / evento.aforo * 100) if evento.aforo > 0 else 0
        
            # Promedio de calificaciones
            promedio = Reseña.objects.filter(evento=evento).aggregate(
                promedio=Avg('puntuacion')
            )['promedio'] or 0
        
            reportes.append({
                'evento_id': evento.id,
                'titulo': evento.titulo,
                'fecha_inicio': evento.fecha_inicio.isoformat(),
                'fecha_fin': evento.fecha_fin.isoformat(),
                'aforo': evento.aforo,
                'total_inscritos': total_inscritos,
                'confirmados': confirmados,
                'pendientes': total_inscritos - confirmados,
                'porcentaje_confirmacion': round(porcentaje_confirmacion, 2),
                'porcentaje_ocupacion': round(porcentaje_ocupacion, 2),
                'promedio_calificacion': round(promedio, 2),
                'estado': 'finalizado' if evento.fecha_fin < timezone.now() else 'activo',
            })
    
     # Estadísticas generales
        total_eventos = len(reportes)
        total_inscritos_general = sum(r['total_inscritos'] for r in reportes)
        total_confirmados_general = sum(r['confirmados'] for r in reportes)
        promedio_ocupacion = sum(r['porcentaje_ocupacion'] for r in reportes) / total_eventos if total_eventos > 0 else 0
    
        return Response({
            'resumen': {
                'total_eventos': total_eventos,
                'total_inscritos': total_inscritos_general,
                'total_confirmados': total_confirmados_general,
                'promedio_ocupacion': round(promedio_ocupacion, 2),
            },
            'eventos': reportes,
        }, status=status.HTTP_200_OK)
        
    
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