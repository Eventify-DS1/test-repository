from celery import shared_task
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from apps.eventos.models import Evento
from apps.notificaciones.models import Notificacion, UsuarioNotificacion
from datetime import timedelta
from django.utils import timezone
import pytz

def _crear_y_enviar_notificacion(evento, etiqueta, mensaje):
    """
    Función auxiliar para crear una notificación y enviarla a los usuarios.
    Retorna True si se creó y envió, False si ya existía.
    """
    # Verificar si ya existe una notificación para este evento con esta etiqueta
    notificacion_existente = Notificacion.objects.filter(
        evento=evento,
        etiqueta=etiqueta
    ).first()
    
    if notificacion_existente:
        return False
    
    # Crear la notificación (solo si no existe)
    try:
        notificacion = Notificacion.objects.create(
            evento=evento,
            tipo='recordatorio',
            etiqueta=etiqueta,
            mensaje=mensaje
        )
    except Exception as e:
        print(f"❌ Error al crear notificación para evento '{evento.titulo}': {str(e)}")
        return False
    
    # Obtener todos los usuarios que deben recibir la notificación
    usuarios_a_notificar = []
    
    # 1. Añadir el organizador
    usuarios_a_notificar.append(evento.organizador)
    
    # 2. Añadir todos los usuarios inscritos
    inscripciones = evento.inscripciones.select_related('usuario').all()
    
    for inscripcion in inscripciones:
        if inscripcion.usuario not in usuarios_a_notificar:
            usuarios_a_notificar.append(inscripcion.usuario)
    
    # Crear las relaciones UsuarioNotificacion y enviar por WebSocket
    for usuario in usuarios_a_notificar:
        UsuarioNotificacion.objects.get_or_create(
            usuario=usuario,
            notificacion=notificacion,
            defaults={'leida': False}
        )
        
        # Enviar notificación por WebSocket al grupo del usuario
        try:
            channel_layer = get_channel_layer()
            grupo_usuario = f"user_{usuario.id}"
            
            async_to_sync(channel_layer.group_send)(
                grupo_usuario,
                {
                    'type': 'send_notification',
                    'notification': {
                        'id': notificacion.id,
                        'tipo': notificacion.tipo,
                        'mensaje': notificacion.mensaje,
                        'evento_id': evento.id if evento else None,
                        'evento_titulo': evento.titulo if evento else None,
                        'fecha_envio': notificacion.fecha_envio.isoformat(),
                        'leida': False
                    }
                }
            )
        except Exception as e:
            print(f"⚠️  Error al enviar WebSocket a usuario {usuario.username}: {str(e)}")
    
    return True


@shared_task
def notificar_eventos_proximos():
    """
    Tarea que se ejecuta periódicamente para buscar eventos que inician en:
    - 15 minutos
    - 1 hora
    - 1 día
    
    Crea notificaciones para los usuarios inscritos y el organizador.
    """
    ahora_utc = timezone.now()
    notificaciones_creadas = 0
    
    # Definir los rangos de tiempo para cada tipo de recordatorio
    recordatorios = [
        {
            'etiqueta': 'recordatorio_15m',
            'mensaje_template': lambda e: f"El evento '{e.titulo}' inicia en 15 minutos. ¡Prepárate!",
            'rango_min': timedelta(minutes=15, seconds=-30),
            'rango_max': timedelta(minutes=15, seconds=30),
        },
        {
            'etiqueta': 'recordatorio_1h',
            'mensaje_template': lambda e: f"El evento '{e.titulo}' inicia en 1 hora. ¡No te lo pierdas!",
            'rango_min': timedelta(hours=1, minutes=-2),
            'rango_max': timedelta(hours=1, minutes=2),
        },
        {
            'etiqueta': 'recordatorio_1d',
            'mensaje_template': lambda e: f"El evento '{e.titulo}' inicia mañana. ¡No olvides asistir!",
            'rango_min': timedelta(days=1, minutes=-30),
            'rango_max': timedelta(days=1, minutes=30),
        },
    ]
    
    # Procesar cada tipo de recordatorio
    for recordatorio in recordatorios:
        rango_inicio = ahora_utc + recordatorio['rango_min']
        rango_fin = ahora_utc + recordatorio['rango_max']
        
        # Buscar eventos que inician en este rango
        eventos_proximos = Evento.objects.filter(
            fecha_inicio__gte=rango_inicio,
            fecha_inicio__lte=rango_fin
        ).select_related('organizador', 'categoria').prefetch_related('inscripciones__usuario')
        
        # Procesar cada evento encontrado
        for evento in eventos_proximos:
            mensaje = recordatorio['mensaje_template'](evento)
            if _crear_y_enviar_notificacion(evento, recordatorio['etiqueta'], mensaje):
                notificaciones_creadas += 1
    
    return f"Proceso completado. {notificaciones_creadas} notificaciones creadas."


@shared_task
def limpiar_notificaciones_eventos_finalizados():
    """
    Tarea que se ejecuta cada medio día para buscar eventos que ya finalizaron
    y eliminar las notificaciones relacionadas a esos eventos.
    
    Esto ayuda a mantener la base de datos limpia eliminando notificaciones
    de eventos que ya no son relevantes.
    """
    ahora_utc = timezone.now()
    
    # Buscar eventos que ya finalizaron (fecha_fin < ahora)
    eventos_finalizados = Evento.objects.filter(
        fecha_fin__lt=ahora_utc
    ).values_list('id', flat=True)
    
    if not eventos_finalizados:
        return "Proceso completado. No hay eventos finalizados."
    
    # Buscar todas las notificaciones relacionadas a estos eventos
    notificaciones_a_eliminar = Notificacion.objects.filter(
        evento_id__in=eventos_finalizados
    )
    
    cantidad_notificaciones = notificaciones_a_eliminar.count()
    cantidad_eventos = len(eventos_finalizados)
    
    if cantidad_notificaciones == 0:
        return f"Proceso completado. {cantidad_eventos} eventos finalizados encontrados, pero no hay notificaciones para eliminar."
    
    # Eliminar las notificaciones (por CASCADE también se eliminarán los UsuarioNotificacion)
    notificaciones_a_eliminar.delete()
    
    return f"Proceso completado. {cantidad_notificaciones} notificaciones eliminadas de {cantidad_eventos} eventos finalizados."


def _crear_y_enviar_notificacion_cambio(evento, mensaje):
    """
    Función auxiliar para crear una notificación de cambio de evento y enviarla a los usuarios.
    Incluye tanto al organizador como a los usuarios inscritos.
    Usa tipo 'evento' y etiqueta 'general'.
    Retorna True si se creó y envió, False si hubo error.
    """
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info(f"🔔 [NOTIF_CAMBIO] Iniciando creación de notificación para evento '{evento.titulo}' (ID: {evento.id})")
    logger.debug(f"📝 [NOTIF_CAMBIO] Mensaje: {mensaje}")
    
    # Crear la notificación (siempre crear una nueva para cada cambio)
    try:
        notificacion = Notificacion.objects.create(
            evento=evento,
            tipo='evento',  # Tipo 'evento' para cambios de evento
            etiqueta='general',  # Etiqueta 'general' para todos los cambios
            mensaje=mensaje
        )
        logger.info(f"✅ [NOTIF_CAMBIO] Notificación creada en BD con ID: {notificacion.id}")
    except Exception as e:
        logger.error(f"❌ [NOTIF_CAMBIO] Error al crear notificación de cambio para evento '{evento.titulo}': {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return False
    
    # Obtener todos los usuarios que deben recibir la notificación
    usuarios_a_notificar = []
    
    # 1. Añadir el organizador
    usuarios_a_notificar.append(evento.organizador)
    logger.debug(f"👤 [NOTIF_CAMBIO] Organizador agregado: {evento.organizador.username} (ID: {evento.organizador.id})")
    
    # 2. Añadir todos los usuarios inscritos
    inscripciones = evento.inscripciones.select_related('usuario').all()
    logger.debug(f"📋 [NOTIF_CAMBIO] Total de inscripciones encontradas: {inscripciones.count()}")
    
    for inscripcion in inscripciones:
        if inscripcion.usuario not in usuarios_a_notificar:
            usuarios_a_notificar.append(inscripcion.usuario)
            logger.debug(f"👤 [NOTIF_CAMBIO] Participante agregado: {inscripcion.usuario.username} (ID: {inscripcion.usuario.id})")
    
    logger.info(f"📊 [NOTIF_CAMBIO] Total de usuarios a notificar: {len(usuarios_a_notificar)} (1 organizador + {len(usuarios_a_notificar) - 1} participantes)")
    
    # Si no hay usuarios a notificar, no hay nada que hacer
    if not usuarios_a_notificar:
        logger.warning(f"⚠️  [NOTIF_CAMBIO] No hay usuarios a notificar para el evento {evento.id}")
        return False
    
    # Crear las relaciones UsuarioNotificacion y enviar por WebSocket
    notificaciones_enviadas = 0
    notificaciones_fallidas = 0
    
    for usuario in usuarios_a_notificar:
        try:
            # Crear relación UsuarioNotificacion
            usuario_notif, created = UsuarioNotificacion.objects.get_or_create(
                usuario=usuario,
                notificacion=notificacion,
                defaults={'leida': False}
            )
            logger.debug(f"💾 [NOTIF_CAMBIO] Relación UsuarioNotificacion {'creada' if created else 'ya existía'} para usuario {usuario.username}")
            
            # Enviar notificación por WebSocket al grupo del usuario
            channel_layer = get_channel_layer()
            grupo_usuario = f"user_{usuario.id}"
            
            logger.debug(f"📡 [NOTIF_CAMBIO] Enviando WebSocket al grupo '{grupo_usuario}' para usuario {usuario.username}")
            
            async_to_sync(channel_layer.group_send)(
                grupo_usuario,
                {
                    'type': 'send_notification',
                    'notification': {
                        'id': notificacion.id,
                        'tipo': notificacion.tipo,
                        'mensaje': notificacion.mensaje,
                        'evento_id': evento.id if evento else None,
                        'evento_titulo': evento.titulo if evento else None,
                        'fecha_envio': notificacion.fecha_envio.isoformat(),
                        'leida': False
                    }
                }
            )
            notificaciones_enviadas += 1
            logger.debug(f"✅ [NOTIF_CAMBIO] WebSocket enviado exitosamente a usuario {usuario.username}")
            
        except Exception as e:
            notificaciones_fallidas += 1
            logger.error(f"⚠️  [NOTIF_CAMBIO] Error al enviar WebSocket a usuario {usuario.username}: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
    
    logger.info(f"📊 [NOTIF_CAMBIO] Resumen: {notificaciones_enviadas} notificaciones enviadas, {notificaciones_fallidas} fallidas")
    
    return True


@shared_task
def notificar_cambio_evento(evento_id, campo_modificado, valor_anterior=None, valor_nuevo=None):
    """
    Tarea Celery para notificar al organizador y a los participantes cuando se modifica:
    - ubicacion
    - fecha_inicio
    - fecha_fin
    
    Args:
        evento_id: ID del evento modificado
        campo_modificado: 'ubicacion', 'fecha_inicio', o 'fecha_fin'
        valor_anterior: Valor anterior del campo (opcional, para el mensaje)
        valor_nuevo: Valor nuevo del campo (opcional, para el mensaje)
    """
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info(f"🔔 [CELERY] Iniciando tarea de notificación de cambio para evento ID: {evento_id}")
    logger.info(f"📋 [CELERY] Campo modificado: {campo_modificado}")
    logger.debug(f"📋 [CELERY] Valor anterior: {valor_anterior}")
    logger.debug(f"📋 [CELERY] Valor nuevo: {valor_nuevo}")
    
    try:
        evento = Evento.objects.select_related('organizador').prefetch_related('inscripciones__usuario').get(id=evento_id)
        logger.info(f"✅ [CELERY] Evento encontrado: '{evento.titulo}' (ID: {evento.id})")
        logger.debug(f"👤 [CELERY] Organizador: {evento.organizador.username} (ID: {evento.organizador.id})")
    except Evento.DoesNotExist:
        error_msg = f"Error: Evento con ID {evento_id} no encontrado."
        logger.error(f"❌ [CELERY] {error_msg}")
        return error_msg
    except Exception as e:
        error_msg = f"Error al obtener evento {evento_id}: {str(e)}"
        logger.error(f"❌ [CELERY] {error_msg}")
        import traceback
        logger.error(traceback.format_exc())
        return error_msg
    
    # Mapear campos a mensajes personalizados
    mapeo_campos = {
        'ubicacion': {
            'mensaje_template': lambda e, ant, nuevo: f"El evento '{e.titulo}' ha cambiado de ubicación. Nueva ubicación: {nuevo if nuevo else 'actualizada'}."
        },
        'fecha_inicio': {
            'mensaje_template': lambda e, ant, nuevo: f"El evento '{e.titulo}' ha cambiado su fecha de inicio. Nueva fecha: {nuevo if nuevo else e.fecha_inicio.strftime('%d/%m/%Y %H:%M')}."
        },
        'fecha_fin': {
            'mensaje_template': lambda e, ant, nuevo: f"El evento '{e.titulo}' ha cambiado su fecha de finalización. Nueva fecha: {nuevo if nuevo else e.fecha_fin.strftime('%d/%m/%Y %H:%M')}."
        }
    }
    
    if campo_modificado not in mapeo_campos:
        error_msg = f"Error: Campo '{campo_modificado}' no es válido para notificaciones de cambio."
        logger.error(f"❌ [CELERY] {error_msg}")
        return error_msg
    
    config_campo = mapeo_campos[campo_modificado]
    
    # Crear mensaje personalizado
    try:
        mensaje = config_campo['mensaje_template'](evento, valor_anterior, valor_nuevo)
        logger.info(f"📝 [CELERY] Mensaje generado: {mensaje}")
    except Exception as e:
        error_msg = f"Error al generar mensaje: {str(e)}"
        logger.error(f"❌ [CELERY] {error_msg}")
        import traceback
        logger.error(traceback.format_exc())
        return error_msg
    
    # Crear y enviar notificación (usa etiqueta 'general')
    logger.info(f"🚀 [CELERY] Llamando a _crear_y_enviar_notificacion_cambio()...")
    resultado = _crear_y_enviar_notificacion_cambio(evento, mensaje)
    
    if resultado:
        success_msg = f"Notificación de cambio de {campo_modificado} enviada para el evento '{evento.titulo}'."
        logger.info(f"✅ [CELERY] {success_msg}")
        return success_msg
    else:
        error_msg = f"No se pudo enviar la notificación de cambio de {campo_modificado} para el evento '{evento.titulo}'."
        logger.error(f"❌ [CELERY] {error_msg}")
        return error_msg