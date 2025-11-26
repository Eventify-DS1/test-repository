"""
Tareas asíncronas para la app usuarios usando Celery.
"""
from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from .models import LoginAttempt, Usuario


@shared_task
def send_email_user_created(user_id, username, user_email):
    """
    Tarea Celery para enviar un email de bienvenida cuando se crea un nuevo usuario.
    """
    subject = "¡Bienvenido a Eventify!"
    message = f"""
Hola {username},

¡Bienvenido a Eventify!

Tu cuenta ha sido creada exitosamente. Ahora puedes:
- Explorar eventos
- Crear tus propios eventos
- Inscribirte en eventos que te interesen
- Calificar eventos después de asistir

Para comenzar, inicia sesión con tu nombre de usuario y contraseña.

Si tienes alguna pregunta, no dudes en contactarnos.

¡Esperamos verte pronto en nuestros eventos!

Saludos,
Equipo Eventify
"""
    try:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [user_email],
            fail_silently=False
        )
        return f"Email de bienvenida enviado a {user_email}"
    except Exception as e:
        # Registrar el error pero no fallar la tarea
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error enviando email de bienvenida a {user_email}: {str(e)}")
        raise


@shared_task
def limpiar_intentos_login():
    """
    Limpia intentos de login antiguos (más de 7 días).
    Se ejecuta diariamente mediante celery beat.
    """
    count = LoginAttempt.limpiar_antiguos(dias=7)
    return f"Se eliminaron {count} registros de intentos de login antiguos"
