from django.db import models
from django.contrib.auth.models import AbstractUser

class Rol(models.Model):
    nombre = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.nombre


class Usuario(AbstractUser):
    ESTADOS_CUENTA = [
        ('pendiente', 'Pendiente'),
        ('verificada', 'Verificada'),
        ('bloqueada', 'Bloqueada'),
    ]

    # Sobrescribimos el email del AbstractUser
    email = models.EmailField(unique=True)

    carrera = models.CharField(max_length=100, null=True, blank=True)
    facultad = models.CharField(max_length=100, null=True, blank=True)
    foto = models.ImageField(upload_to='usuarios/', null=True, blank=True)
    estado_cuenta = models.CharField(
        max_length=20,
        choices=ESTADOS_CUENTA,
        default='pendiente'
    )
    rol = models.ForeignKey(Rol, on_delete=models.PROTECT, related_name='usuarios')

    USERNAME_FIELD = 'username'        # Usamos el username para login (por ahora)
    REQUIRED_FIELDS = ['email']        # Email será obligatorio

    def __str__(self):
        return f"{self.username} ({self.rol.nombre})"
