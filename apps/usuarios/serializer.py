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
        required=True,
        validators=[UniqueValidator(queryset=Usuario.objects.all())]
    )

    # Campo para asignar el rol mediante su ID (solo escritura)
    rol_id = serializers.PrimaryKeyRelatedField(
        queryset=Rol.objects.all(),
        write_only=True
    )

    # Campos de contraseña: protegidos (write_only) y validados
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}  # estilo para formularios
    )
    password2 = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )

    # Rol anidado (solo lectura)
    rol = RolSerializer(read_only=True)

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
            'estado_cuenta',
            'rol',
            'rol_id',
            'password',
            'password2'
        ]
        read_only_fields = ['estado_cuenta']

    # === Validaciones personalizadas ===
    def validate(self, attrs):
        """
        Verifica que las contraseñas coincidan antes de crear o actualizar el usuario.
        """
        if attrs.get('password') != attrs.get('password2'):
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
        password = validated_data.pop('password')

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
