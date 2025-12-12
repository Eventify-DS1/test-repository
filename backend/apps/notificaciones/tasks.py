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
