"""
Comando de gestión para limpiar intentos de login antiguos.
Ejecutar periódicamente con celery beat o cron.
"""
from django.core.management.base import BaseCommand
from apps.usuarios.models import LoginAttempt


class Command(BaseCommand):
    help = 'Limpia intentos de login antiguos (más de 7 días)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dias',
            type=int,
            default=7,
            help='Número de días para mantener los registros (default: 7)',
        )

    def handle(self, *args, **options):
        dias = options['dias']
        count = LoginAttempt.limpiar_antiguos(dias)
        self.stdout.write(
            self.style.SUCCESS(f'Se eliminaron {count} registros de intentos de login antiguos.')
        )

