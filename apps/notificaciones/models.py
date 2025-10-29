from django.db import models
from django.conf import settings

Usuario = settings.AUTH_USER_MODEL

class Notificacion(models.Model):
    TIPOS_NOTIFICACION = [
        ('recordatorio', 'Recordatorio'),
        ('evento', 'Evento'),
        ('sistema', 'Sistema'),
    ]

    tipo = models.CharField(max_length=50, choices=TIPOS_NOTIFICACION)
    mensaje = models.TextField()
    fecha_envio = models.DateTimeField(auto_now_add=True)
    leida = models.BooleanField(default=False)

    class Meta:
        ordering = ['-fecha_envio']
        verbose_name = "Notificación"
        verbose_name_plural = "Notificaciones"

    def __str__(self):
        estado = "Leída" if self.leida else "No leída"
        return f"{self.tipo} - {estado}"

class UsuarioNotificacion(models.Model):
    usuario = models.ForeignKey(
        Usuario,
        on_delete=models.CASCADE,
        related_name='notificaciones'
    )
    notificacion = models.ForeignKey(
        Notificacion,
        on_delete=models.CASCADE,
        related_name='destinatarios'
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['usuario', 'notificacion'], name='unique_usuario_notificacion')
        ]
        verbose_name = "Usuario - Notificación"
        verbose_name_plural = "Usuarios - Notificaciones"

    def __str__(self):
        return f"{self.usuario} ↔ {self.notificacion.tipo}"
