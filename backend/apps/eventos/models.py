from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone

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

