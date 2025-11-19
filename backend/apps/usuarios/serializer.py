from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from django.contrib.auth.password_validation import validate_password
from .models import Usuario, Rol
from django.utils import timezone

class RolSerializer(serializers.ModelSerializer):
    """
    Serializador para el modelo Rol.
    Permite representar y crear roles de usuario dentro del sistema.
    """
    class Meta:
        model = Rol
        fields = '__all__'


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
        """
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
        
        if Usuario.objects.filter(email=value).exists():
            raise serializers.ValidationError("Este correo electrónico ya está en uso.")
        return value

    # Campo para asignar el rol mediante su ID (solo escritura)
    rol = serializers.PrimaryKeyRelatedField(
        queryset=Rol.objects.all(),
        write_only=True
    )

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
    rol_data = RolSerializer(read_only=True)

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
            'password2'
        ]
        extra_kwargs = {
            'username': {'required': True},  # El username no se puede cambiar
            'first_name': {'required': False, 'allow_blank': True},
            'last_name': {'required': False, 'allow_blank': True},
            'carrera': {'required': False, 'allow_blank': True},
            'facultad': {'required': False, 'allow_blank': True},
            'codigo_estudiantil': {'required': False, 'allow_blank': True},
            'email': {'required': False, 'allow_blank': True},
        }

    # === Validaciones personalizadas ===
    def validate(self, attrs):
        """
        Verifica que las contraseñas coincidan antes de crear o actualizar el usuario.
        """
        # Si se proporciona password, también debe proporcionarse password2
        password = attrs.get('password')
        password2 = attrs.get('password2')
        
        if password or password2:
            if not password or not password2:
                raise serializers.ValidationError({"password": "Debes proporcionar ambas contraseñas."})
            if password != password2:
                raise serializers.ValidationError({"password": "Las contraseñas no coinciden."})
        
        return attrs

    # === Creación personalizada ===
    def create(self, validated_data):
        """
        Crea un nuevo usuario asegurando el hash de la contraseña.
        - Se elimina 'password2' ya que no se guarda en el modelo.
        - Se usa set_password() para encriptar la contraseña antes de guardar.
        """
        validated_data.pop('password2', None)
        password = validated_data.pop('password', None)
        
        if not password:
            raise serializers.ValidationError({"password": "La contraseña es obligatoria al crear un usuario."})

        user = Usuario(**validated_data)
        user.set_password(password)
        user.save()
        return user

    # === Actualización personalizada ===
    def update(self, instance, validated_data):
        """
        Permite actualizar un usuario:
        - Si incluye contraseña, se re-encripta con set_password().
        - Los demás atributos se actualizan de forma dinámica con setattr().
        """
        password = validated_data.pop('password', None)
        validated_data.pop('password2', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)
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
