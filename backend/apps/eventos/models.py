from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
import secrets
import string

Usuario = settings.AUTH_USER_MODEL

class CategoriaEvento(models.Model):
    nombre = models.CharField(max_length=50, unique=True)

    class Meta:
        verbose_name = "Categoría de Evento"
        verbose_name_plural = "Categorías de Eventos"
        ordering = ['nombre']

    def __str__(self):
        return self.nombre

class Evento(models.Model):
    titulo = models.CharField(max_length=210)
    descripcion = models.TextField()
    fecha_inicio = models.DateTimeField()
    fecha_fin = models.DateTimeField()
    aforo = models.PositiveIntegerField()
    ubicacion = models.CharField(max_length=200)
    foto = models.ImageField(upload_to='eventos/', null=True, blank=True)
    asistentes = models.ManyToManyField(Usuario, through='Inscripcion', related_name='eventos_asistidos')
    codigo_confirmacion = models.CharField(max_length=10, unique=True, editable=False)

    # Relaciones
    organizador = models.ForeignKey(
        Usuario,
        on_delete=models.CASCADE,
        related_name='eventos_creados'
    )
    categoria = models.ForeignKey(
        CategoriaEvento,
        on_delete=models.CASCADE,
        null=True,
        related_name='eventos'
    )
    
    def generar_codigo_confirmacion(self):
        """Genera un código aleatorio de 6 caracteres alfanuméricos"""
        caracteres = string.ascii_uppercase + string.digits
        codigo = ''.join(secrets.choice(caracteres) for _ in range(6))
        # Asegurar que el código sea único
        while Evento.objects.filter(codigo_confirmacion=codigo).exists():
            codigo = ''.join(secrets.choice(caracteres) for _ in range(6))
        return codigo
    
    def save(self, *args, **kwargs):
        # Generar código de confirmación solo si es un nuevo evento
        if not self.pk and not self.codigo_confirmacion:
            self.codigo_confirmacion = self.generar_codigo_confirmacion()
        super().save(*args, **kwargs)

    class Meta:
        verbose_name = "Evento"
        verbose_name_plural = "Eventos"
        ordering = ['fecha_inicio']

    def __str__(self):
        return f"{self.titulo} - {self.fecha_inicio.strftime('%d/%m/%Y')}"

    # Validaciones de negocio
    def clean(self):
        super().clean()
        # Validar orden lógico de fechas
        if self.fecha_fin < self.fecha_inicio:
            raise ValidationError("La fecha de fin no puede ser anterior a la fecha de inicio.")
        # Evitar eventos en el pasado
        if self.fecha_inicio < timezone.now():
            raise ValidationError("No se pueden crear eventos en el pasado. Adelantala.")

    # Método útil para lógica de inscripción
    def tiene_cupos_disponibles(self):
        inscripciones_count = self.inscripciones.count()
        return inscripciones_count < self.aforo

class Inscripcion(models.Model):
    usuario = models.ForeignKey(
        Usuario,
        on_delete=models.CASCADE,
        related_name='inscripciones'
    )
    evento = models.ForeignKey(
        Evento,
        on_delete=models.CASCADE,
        related_name='inscripciones'
    )
    fecha_inscripcion = models.DateTimeField(auto_now_add=True)
    asistencia_confirmada = models.BooleanField(default=False)
    fecha_confirmacion = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['usuario', 'evento'], name='unique_inscripcion')
        ]
        verbose_name = "Inscripción"
        verbose_name_plural = "Inscripciones"

    def __str__(self):
        return f"{self.usuario} inscrito en {self.evento}"

class Reseña(models.Model):
    evento = models.ForeignKey(
        Evento,
        on_delete=models.CASCADE,
        related_name='reseñas'
    )
    usuario = models.ForeignKey(
        Usuario,
        on_delete=models.CASCADE,
        related_name='reseñas'
    )
    comentario = models.TextField(blank=True, null=True)
    puntuacion = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        null=True,
        blank=True
    )
    fecha = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Reseña"
        verbose_name_plural = "Reseñas"
        ordering = ['-fecha']

    def __str__(self):
        return f"Reseña de {self.usuario} en {self.evento}"

class Favorito(models.Model):
    """
    Modelo para almacenar eventos marcados como favoritos por los usuarios.
    """
    usuario = models.ForeignKey(
        Usuario,
        on_delete=models.CASCADE,
        related_name='favoritos'
    )
    evento = models.ForeignKey(
        Evento,
        on_delete=models.CASCADE,
        related_name='favoritos'
    )
    fecha_agregado = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['usuario', 'evento'], name='unique_favorito')
        ]
        verbose_name = "Favorito"
        verbose_name_plural = "Favoritos"
        ordering = ['-fecha_agregado']

    def __str__(self):
        return f"{self.usuario} - {self.evento}"

