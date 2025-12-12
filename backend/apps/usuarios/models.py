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


class LoginAttempt(models.Model):
    """
    Modelo para rastrear intentos de login fallidos y prevenir ataques de fuerza bruta.
    """
    ip_address = models.GenericIPAddressField(help_text="Dirección IP del intento de login")
    username = models.CharField(max_length=150, null=True, blank=True, help_text="Username intentado (opcional para privacidad)")
    intentos = models.IntegerField(default=1, help_text="Número de intentos fallidos")
    bloqueado_hasta = models.DateTimeField(null=True, blank=True, help_text="Fecha hasta la cual está bloqueado")
    ultimo_intento = models.DateTimeField(auto_now=True, help_text="Último intento de login")
    creado_en = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-ultimo_intento']
        indexes = [
            models.Index(fields=['ip_address', 'ultimo_intento']),
            models.Index(fields=['bloqueado_hasta']),
        ]
        unique_together = [['ip_address', 'username']]
    
    def __str__(self):
        return f"Login attempt from {self.ip_address} - {self.intentos} attempts"
    
    def esta_bloqueado(self):
        """Verifica si la IP/username está bloqueada"""
        if self.bloqueado_hasta and timezone.now() < self.bloqueado_hasta:
            return True
        return False
    
    def incrementar_intento(self):
        """Incrementa el contador de intentos y bloquea si es necesario"""
        from django.conf import settings
        
        self.intentos += 1
        self.ultimo_intento = timezone.now()
        
        # Obtener configuración de intentos y tiempo de bloqueo desde settings
        max_intentos = getattr(settings, 'LOGIN_MAX_ATTEMPTS', 5)
        tiempo_bloqueo_minutos = getattr(settings, 'LOGIN_BLOCK_TIME_MINUTES', 15)
        
        # Bloquear después de X intentos fallidos por Y minutos
        if self.intentos >= max_intentos:
            self.bloqueado_hasta = timezone.now() + timedelta(minutes=tiempo_bloqueo_minutos)
        
        self.save()
    
    def resetear(self):
        """Resetea los intentos después de un login exitoso"""
        self.intentos = 0
        self.bloqueado_hasta = None
        self.save()
    
    @classmethod
    def obtener_o_crear(cls, ip_address, username=None):
        """Obtiene o crea un registro de intento de login"""
        try:
            return cls.objects.get(ip_address=ip_address, username=username)
        except cls.DoesNotExist:
            return cls.objects.create(ip_address=ip_address, username=username)
    
    @classmethod
    def limpiar_antiguos(cls, dias=7):
        """Elimina registros de intentos más antiguos que X días"""
        fecha_limite = timezone.now() - timedelta(days=dias)
        cls.objects.filter(ultimo_intento__lt=fecha_limite).delete()


class PasswordResetCode(models.Model):
    """
    Modelo para almacenar códigos de recuperación de contraseña.
    Los códigos expiran después de 15 minutos y solo pueden usarse una vez.
    """
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='password_reset_codes')
    codigo = models.CharField(max_length=6)
    session_id = models.CharField(max_length=100, unique=True, help_text="ID de sesión para la recuperación")
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
        return f"Password Reset Code for {self.usuario.username} - {self.codigo}"
    
    def es_valido(self):
        """Verifica si el código es válido (no usado y no expirado)"""
        if self.usado:
            return False
        
        # Los códigos expiran después de 15 minutos
        expiracion = self.creado_en + timedelta(minutes=15)
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
        """Genera un nuevo código de recuperación de 6 dígitos"""
        # Eliminar códigos antiguos del usuario
        cls.objects.filter(usuario=usuario, usado=False).delete()
        
        # Generar código de 6 dígitos
        codigo = ''.join([str(secrets.randbelow(10)) for _ in range(6)])
        
        return cls.objects.create(
            usuario=usuario,
            codigo=codigo,
            session_id=session_id
        )
    
    def obtener_email_masked(self):
        """Retorna el email con las primeras 2 letras visibles y el resto asteriscos"""
        email = self.usuario.email
        if len(email) < 3:
            return "**@***"
        
        # Separar local y dominio
        if '@' in email:
            local, dominio = email.split('@', 1)
            if len(local) <= 2:
                masked_local = local[0] + '*' * (len(local) - 1) if len(local) > 1 else '*'
            else:
                masked_local = local[:2] + '*' * (len(local) - 2)
            return f"{masked_local}@{dominio}"
        else:
            # Si no tiene @, mostrar solo las primeras 2 letras
            return email[:2] + '*' * (len(email) - 2) if len(email) > 2 else email