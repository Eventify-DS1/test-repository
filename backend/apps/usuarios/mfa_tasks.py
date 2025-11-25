from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings

def _send_mfa_email_sync(user_email, username, codigo):
    """
    Función helper para enviar código MFA por email (síncrono).
    Puede ser llamada directamente o desde una tarea Celery.
    Retorna True si el email se envió correctamente, False en caso contrario.
    """
    subject = "Código de verificación Eventify"
    message = f"""
Hola {username},

Tu código de verificación para iniciar sesión en Eventify es:

{codigo}

Este código expira en 10 minutos y solo puede usarse una vez.

Si no solicitaste este código, ignora este mensaje.

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
def send_mfa_code_email(user_email, username, codigo):
    """
    Tarea Celery para enviar el código MFA por email al usuario.
    Similar a send_email_user_created, llama directamente a send_mail.
    """
    subject = "Código de verificación Eventify"
    message = f"""
Hola {username},

Tu código de verificación para iniciar sesión en Eventify es:

{codigo}

Este código expira en 10 minutos y solo puede usarse una vez.

Si no solicitaste este código, ignora este mensaje.

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

