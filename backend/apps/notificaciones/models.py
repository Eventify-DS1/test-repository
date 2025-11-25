from django.db import models
from django.conf import settings
# Importamos el modelo Evento para hacer la relación
from apps.eventos.models import Evento 

Usuario = settings.AUTH_USER_MODEL

class Notificacion(models.Model):
    TIPOS_NOTIFICACION = [
        ('recordatorio', 'Recordatorio'),
        ('evento', 'Evento'),
        ('sistema', 'Sistema'),
    ]

    # --- CAMBIO 1: ETIQUETAS DE CONTROL ---
    # Estas etiquetas nos permiten distinguir "Aviso de 15 min" de "Aviso de 2 horas"
    ETIQUETAS = [
    ('recordatorio_15m', 'Recordatorio 15 Minutos'),
    ('recordatorio_1h', 'Recordatorio 1 Hora'),
    ('recordatorio_1d', 'Recordatorio 1 Día'),
    ('general', 'General'),
]

    # --- CAMBIO 2: VINCULACIÓN CON EVENTO ---
    # Esto permite saber a qué evento pertenece esta notificación
    evento = models.ForeignKey(
        Evento, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        related_name='notificaciones_generadas'
    )

    tipo = models.CharField(max_length=50, choices=TIPOS_NOTIFICACION)
    
    # --- CAMBIO 3: EL CAMPO ETIQUETA ---
    # Este es el "sello" que Celery buscará para no repetir envíos.
    etiqueta = models.CharField(max_length=50, choices=ETIQUETAS, null=True, blank=True)

    mensaje = models.TextField()
    fecha_envio = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-fecha_envio']
        verbose_name = "Notificación"
        verbose_name_plural = "Notificaciones"

    def __str__(self):
        # Ayuda visual en el admin: "Recordatorio (recordatorio_15m) - Evento X"
        etiqueta_str = f"({self.etiqueta})" if self.etiqueta else ""
        return f"{self.tipo} {etiqueta_str} - {self.evento}"

class UsuarioNotificacion(models.Model):
    """
    Modelo intermedio que relaciona usuarios con notificaciones.
    Similar a Inscripcion con Evento:
    - Eliminación en cascada: Si se elimina el usuario o la notificación,
      se eliminan automáticamente los registros relacionados.
    - Actualización en cascada: Django actualiza automáticamente las claves
      foráneas cuando se actualiza la clave primaria del modelo relacionado.
    """
    usuario = models.ForeignKey(
        Usuario,
        on_delete=models.CASCADE,  # Eliminación en cascada: si se elimina el usuario, se eliminan sus notificaciones
        related_name='notificaciones'
    )
    notificacion = models.ForeignKey(
        Notificacion,
        on_delete=models.CASCADE,  # Eliminación en cascada: si se elimina la notificación, se eliminan las relaciones
        related_name='destinatarios'
    )

    leida = models.BooleanField(default=False)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['usuario', 'notificacion'], name='unique_usuario_notificacion')
        ]
        verbose_name = "Usuario - Notificación"
        verbose_name_plural = "Usuarios - Notificaciones"

    def __str__(self):
        return f"{self.usuario} ↔ {self.notificacion.tipo}"