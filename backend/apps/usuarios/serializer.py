from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from django.contrib.auth.password_validation import validate_password
from .models import Usuario, Rol
from django.utils import timezone
from backend.security_utils import sanitize_text

class RolSerializer(serializers.ModelSerializer):
    """
    Serializador para el modelo Rol.
    Permite representar y crear roles de usuario dentro del sistema.
    """
    class Meta:
        model = Rol
        fields = ['id', 'nombre']


class UsuarioSerializer(serializers.ModelSerializer):
    """
    Serializador para el modelo Usuario.
    Gestiona tanto la creación como la actualización de usuarios,
    incluyendo validaciones de contraseña, unicidad del correo y rol asignado.
    """

    # Campo de correo con validador de unicidad
    email = serializers.EmailField(
        required=False
    )
    
    def validate_email(self, value):
        """
        Valida que el email sea único, excluyendo al usuario actual en actualizaciones.
        También sanitiza el email para prevenir XSS.
        """
        # Normalizar: convertir None a cadena vacía y luego verificar
        if value is None:
            value = ''
        
        # Sanitizar el email para prevenir XSS
        if value:
            value = sanitize_text(value, max_length=254)  # Max length de EmailField
        
        # En creación, el email es requerido
        if not self.instance and not value:
            raise serializers.ValidationError("El correo electrónico es obligatorio.")
        
        # En actualización, permitir vacío (mantener el actual)
        if self.instance and not value:
            return self.instance.email
        
        # Validar unicidad excluyendo al usuario actual
        user = self.instance
        if user and user.email == value:
            return value  # Si es el mismo email, no hay problema
        
        # Validar unicidad solo si hay un valor
        if value and Usuario.objects.filter(email=value).exclude(pk=user.pk if user else None).exists():
            raise serializers.ValidationError("Este correo electrónico ya está en uso.")
        return value

    # Campo para asignar el rol mediante su ID 
    rol = serializers.PrimaryKeyRelatedField(
        queryset=Rol.objects.all(),
        write_only=True,
        required=True,
        allow_null=False
    )
    
    def validate_rol(self, value):
        """
        Valida que el rol exista y sea válido.
        """
        if value is None:
            raise serializers.ValidationError("El rol es obligatorio.")
        if not Rol.objects.filter(pk=value.pk).exists():
            raise serializers.ValidationError("El rol especificado no existe.")
        return value

    # Campos de contraseña: protegidos (write_only) y validados
    password = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
        validators=[validate_password],
        style={'input_type': 'password'}  # estilo para formularios
    )
    password2 = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
        style={'input_type': 'password'}
    )

    # Rol anidado (solo lectura)
    rol_data = RolSerializer(source='rol', read_only=True)

    class Meta:
        model = Usuario
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'carrera',
            'facultad',
            'foto',
            'codigo_estudiantil',
            'rol',
            'rol_data',
            'password',
            'password2',
            'is_staff',
            'is_superuser',
        ]
        extra_kwargs = {
            'username': {'required': True},
            'first_name': {'required': False, 'allow_blank': True},
            'last_name': {'required': False, 'allow_blank': True},
            'carrera': {'required': False, 'allow_blank': True},
            'facultad': {'required': False, 'allow_blank': True},
            'codigo_estudiantil': {'required': False, 'allow_blank': True},
            'email': {'required': False, 'allow_blank': True},
            'is_staff': {'read_only': True},
            'is_superuser': {'read_only': True},  
        }

    # === Validaciones personalizadas ===
    def validate(self, attrs):
        """
        Verifica que las contraseñas coincidan antes de crear o actualizar el usuario.
        También sanitiza campos de texto para prevenir XSS.
        """
        # Sanitizar campos de texto
        text_fields = ['username', 'first_name', 'last_name', 'carrera', 'facultad', 'codigo_estudiantil']
        for field in text_fields:
            if field in attrs and attrs[field]:
                attrs[field] = sanitize_text(attrs[field])
        
        # Si se proporciona password, también debe proporcionarse password2
        password = attrs.get('password')
        password2 = attrs.get('password2')
        
        if password or password2:
            if not password or not password2:
                raise serializers.ValidationError({"password": "Debes proporcionar ambas contraseñas."})
            if password != password2:
                raise serializers.ValidationError({"password": "Las contraseñas no coinciden."})
        
        return attrs
    
    def to_representation(self, instance):
        """
        Sobrescribe la representación para devolver solo la ruta relativa de la foto
        en lugar de la URL absoluta (que puede contener backend:8000).
        """
        representation = super().to_representation(instance)
        foto_url = representation.get('foto')
        if foto_url:
            # Si es una URL absoluta, extraer solo la ruta relativa
            if isinstance(foto_url, str) and (foto_url.startswith('http://') or foto_url.startswith('https://')):
                from urllib.parse import urlparse
                parsed = urlparse(foto_url)
                representation['foto'] = parsed.path
            # Asegurar que comience con / si es una cadena y no está vacía
            elif isinstance(foto_url, str) and foto_url and not foto_url.startswith('/'):
                representation['foto'] = f'/{foto_url}'
        return representation

    # === Creación personalizada ===
    def create(self, validated_data):
        """
        Crea un nuevo usuario asegurando el hash de la contraseña.
        Si el rol es 'admin' o 'administrador', automáticamente se hace staff y superuser.
        """
        validated_data.pop('password2', None)
        password = validated_data.pop('password', None)
        
        if not password:
            raise serializers.ValidationError({"password": "La contraseña es obligatoria al crear un usuario."})

        # Extraer el rol antes de crear el usuario
        rol = validated_data.get('rol')
        
        user = Usuario(**validated_data)
        user.set_password(password)

        if rol and rol.nombre.lower() in ['admin', 'administrador']:
            user.is_staff = True
            user.is_superuser = True
        
        user.save()
        return user

    # === Actualización personalizada ===
    def update(self, instance, validated_data):
        """
        Permite actualizar un usuario:
        - Si incluye contraseña, se re-encripta con set_password().
        - Si se cambia el rol a admin, se actualiza is_staff y is_superuser.
        - Los demás atributos se actualizan de forma dinámica con setattr().
        """
        password = validated_data.pop('password', None)
        validated_data.pop('password2', None)

        # Extraer el rol si está siendo actualizado
        rol = validated_data.get('rol')

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)
        
        # Si el rol cambia a admin, actualizar permisos
        if rol:
            if rol.nombre.lower() in ['admin', 'administrador']:
                instance.is_staff = True
                instance.is_superuser = True
            else:
                # Si el rol ya no es admin, quitar permisos de staff/superuser
                instance.is_staff = False
                instance.is_superuser = False
        
        instance.save()
        return instance


class EstadisticasUsuariosSerializer(serializers.ModelSerializer):
    """
    Serializador para estadísticas de usuarios.
    Extiende del modelo Usuario para tener acceso a las consultas.
    """
    total_usuarios = serializers.SerializerMethodField()

    class Meta:
        model = Usuario
        fields = ['total_usuarios']

    def get_total_usuarios(self, obj):
        """
        Retorna el total de usuarios registrados en el sistema.
        """
        return Usuario.objects.count()