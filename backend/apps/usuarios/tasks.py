from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings

@shared_task
def send_email_user_created(user_id, username, user_email):
    subject = f"Welcome to Eventify {username}"
    message = (f"Welcome to Eventify {username}, your account has been created successfully. We hope you enjoy our platform. Begin to create events and invite your friends.")
    return send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user_email])