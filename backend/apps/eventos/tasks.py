from celery import shared_task
import django.core.mail as send_mail
from django.conf import settings

@shared_task
def send_email_task(event_id, message, user_email):
    subject = "Ping test"
    message = (f"This is a test ping from the backend, with the message: {event_id} - {message}")
    return send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user_email])

