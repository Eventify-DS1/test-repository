from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings

def _send_password_reset_email_sync(user_email, username, codigo):
    """
    Función helper para enviar código de recuperación de contraseña por email (síncrono).
    Puede ser llamada directamente o desde una tarea Celery.
    Retorna True si el email se envió correctamente, False en caso contrario.
    """
    subject = "Recuperación de contraseña - Eventify"
    message = f"""
Hola {username},

Has solicitado recuperar tu contraseña en Eventify.

Tu código de recuperación es:

{codigo}

Este código expira en 15 minutos y solo puede usarse una vez.

Si no solicitaste este código, ignora este mensaje. Tu cuenta permanece segura.

Saludos,
Equipo Eventify
"""
    try:
        return send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [user_email],
            fail_silently=True  # No lanzar excepción si falla
        )
    except Exception:
        # Si falla silenciosamente, retornar False
        return False

@shared_task
def send_password_reset_code_email(user_email, username, codigo):
    """
    Tarea Celery para enviar el código de recuperación de contraseña por email al usuario.
    """
    subject = "Recuperación de contraseña - Eventify"
    message = f"""
Hola {username},

Has solicitado recuperar tu contraseña en Eventify.

Tu código de recuperación es:

{codigo}

Este código expira en 15 minutos y solo puede usarse una vez.

Si no solicitaste este código, ignora este mensaje. Tu cuenta permanece segura.

Saludos,
Equipo Eventify
"""
    return send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [user_email],
        fail_silently=False  # Lanzar excepción si falla para que Celery la maneje
    )

