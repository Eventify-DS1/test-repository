from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from .models import Evento, Inscripcion
import logging

logger = logging.getLogger(__name__)

@shared_task
def send_email_task(event_id, message, user_email):
    subject = "Ping test"
    message = (f"This is a test ping from the backend, with the message: {event_id} - {message}")
    return send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user_email])


@shared_task
def send_message_to_inscritos(event_id, subject, message, organizador_nombre):
    """
    Tarea Celery para enviar un mensaje por email a todos los inscritos de un evento.
    
    Args:
        event_id: ID del evento
        subject: Asunto del mensaje
        message: Contenido del mensaje
        organizador_nombre: Nombre del organizador que envía el mensaje
    """
    try:
        evento = Evento.objects.get(pk=event_id)
        
        # Obtener todos los inscritos con sus emails
        inscripciones = Inscripcion.objects.filter(evento=evento).select_related('usuario')
        
        emails_enviados = 0
        emails_fallidos = 0
        
        # Construir el mensaje completo
        mensaje_completo = f"""
Hola,

El organizador del evento "{evento.titulo}" ({organizador_nombre}) te ha enviado el siguiente mensaje:

---
{message}
---

Información del evento:
- Título: {evento.titulo}
- Fecha de inicio: {evento.fecha_inicio.strftime('%d/%m/%Y %H:%M')}
- Fecha de fin: {evento.fecha_fin.strftime('%d/%m/%Y %H:%M')}
- Ubicación: {evento.ubicacion}

Si tienes alguna pregunta, puedes contactar al organizador a través de la plataforma.

Saludos,
Equipo Eventify
"""
        
        # Enviar email a cada inscrito
        for inscripcion in inscripciones:
            usuario = inscripcion.usuario
            if usuario.email:
                try:
                    send_mail(
                        subject,
                        mensaje_completo,
                        settings.DEFAULT_FROM_EMAIL,
                        [usuario.email],
                        fail_silently=False
                    )
                    emails_enviados += 1
                except Exception as e:
                    logger.error(f"Error enviando email a {usuario.email} para evento {evento.titulo}: {str(e)}")
                    emails_fallidos += 1
        
        return {
            'evento': evento.titulo,
            'emails_enviados': emails_enviados,
            'emails_fallidos': emails_fallidos,
            'total_inscritos': inscripciones.count()
        }
        
    except Evento.DoesNotExist:
        logger.error(f"Evento con ID {event_id} no encontrado")
        raise
    except Exception as e:
        logger.error(f"Error en send_message_to_inscritos para evento {event_id}: {str(e)}")
        raise

