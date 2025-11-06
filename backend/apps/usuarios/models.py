from django.db import models
from django.contrib.auth.models import AbstractUser

class Rol(models.Model):
    nombre = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.nombre


class Usuario(AbstractUser):
    

    # Sobrescribimos el email del AbstractUser
    email = models.EmailField(unique=True)

    carrera = models.CharField(max_length=100, null=True, blank=True)
    facultad = models.CharField(max_length=100, null=True, blank=True)
    foto = models.ImageField(upload_to='usuarios/', null=True, blank=True)
    codigo_estudiantil = models.CharField(max_length=10, null=True, blank=True)
    rol = models.ForeignKey(Rol, on_delete=models.PROTECT, related_name='usuarios',
                            null=False, blank= False, default=1)

    USERNAME_FIELD = 'username'        # Usamos el username para login (por ahora)
    REQUIRED_FIELDS = ['email']        # Email será obligatorio

    def __str__(self):
        return f"{self.username} ({self.rol.nombre})"
