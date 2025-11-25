from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from datetime import timedelta
import secrets

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
    
    # MFA (Multi-Factor Authentication)
    mfa_enabled = models.BooleanField(default=True, help_text="Habilita autenticación de dos factores")
    mfa_secret = models.CharField(max_length=32, null=True, blank=True, help_text="Secreto para MFA (opcional)")
    last_mfa_verification = models.DateTimeField(null=True, blank=True, help_text="Última vez que el usuario completó MFA exitosamente")

    USERNAME_FIELD = 'username'        # Usamos el username para login (por ahora)
    REQUIRED_FIELDS = ['email']        # Email será obligatorio

    def __str__(self):
        return f"{self.username} ({self.rol.nombre})"


class MFACode(models.Model):
    """
    Modelo para almacenar códigos MFA temporales.
    Los códigos expiran después de 10 minutos y solo pueden usarse una vez.
    """
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='mfa_codes')
    codigo = models.CharField(max_length=6)
    session_id = models.CharField(max_length=100, unique=True, help_text="ID de sesión para el login")
    creado_en = models.DateTimeField(auto_now_add=True)
    usado = models.BooleanField(default=False)
    intentos = models.IntegerField(default=0, help_text="Número de intentos fallidos")
    
    class Meta:
        ordering = ['-creado_en']
        indexes = [
            models.Index(fields=['session_id', 'usado']),
            models.Index(fields=['usuario', 'creado_en']),
        ]
    
    def __str__(self):
        return f"MFA Code for {self.usuario.username} - {self.codigo}"
    
    def es_valido(self):
        """Verifica si el código es válido (no usado y no expirado)"""
        if self.usado:
            return False
        
        # Los códigos expiran después de 10 minutos
        expiracion = self.creado_en + timedelta(minutes=10)
        if timezone.now() > expiracion:
            return False
        
        return True
    
    def marcar_como_usado(self):
        """Marca el código como usado"""
        self.usado = True
        self.save()
    
    def incrementar_intentos(self):
        """Incrementa el contador de intentos fallidos"""
        self.intentos += 1
        self.save()
    
    @classmethod
    def generar_codigo(cls, usuario, session_id):
        """Genera un nuevo código MFA de 6 dígitos"""
        # Eliminar códigos antiguos del usuario
        cls.objects.filter(usuario=usuario, usado=False).delete()
        
        # Generar código de 6 dígitos
        codigo = ''.join([str(secrets.randbelow(10)) for _ in range(6)])
        
        return cls.objects.create(
            usuario=usuario,
            codigo=codigo,
            session_id=session_id
        )
