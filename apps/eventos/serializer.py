from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from django.utils import timezone
from .models import Evento, CategoriaEvento

class CategoriaEventoSerializer(serializers.ModelSerializer):
    """
    Serializador para el modelo CategoriaEvento.
    Permite representar y crear categorías de eventos.
    """
    nombre = serializers.CharField(
        max_length=50,
        validators=[UniqueValidator(queryset=CategoriaEvento.objects.all())]
    )

    class Meta:
        model = CategoriaEvento
        fields = '__all__'


class EventoSerializer(serializers.ModelSerializer):
    """
    Serializador para el modelo Evento.
    Incluye validaciones de fechas y asigna automáticamente el organizador
    a partir del usuario autenticado (context['request'].user).
    """

    # Relación anidada para lectura (devuelve los datos de la categoría)
    categoria = CategoriaEventoSerializer(read_only=True)

    # Campo para escritura (permite asignar la categoría por su ID)
    categoria_id = serializers.PrimaryKeyRelatedField(
        queryset=CategoriaEvento.objects.all(),
        source='categoria',
        write_only=True
    )

    # Campo de solo lectura: muestra el nombre del organizador (relación con Usuario)
    organizador = serializers.StringRelatedField(read_only=True)

    """
    Se puede también mandando toda la info del organizador

    organizador = UsuarioSerializer(read_only=True)
    """

    class Meta:
        model = Evento
        fields = [
            'id',
            'titulo',
            'descripcion',
            'fecha_inicio',
            'fecha_fin',
            'aforo',
            'ubicacion',
            'foto',
            'organizador',
            'categoria',
            'categoria_id',
        ]

    # === Validaciones personalizadas ===
    def validate(self, attrs):
        """
        Valida que las fechas del evento sean lógicas:
        - fecha_fin debe ser posterior a fecha_inicio.
        - fecha_inicio no puede estar en el pasado.
        """
        fecha_inicio = attrs.get('fecha_inicio')
        fecha_fin = attrs.get('fecha_fin')

        if fecha_inicio and fecha_fin and fecha_fin < fecha_inicio:
            raise serializers.ValidationError(
                {"fecha_fin": "La fecha de fin no puede ser anterior a la fecha de inicio."}
            )

        if fecha_inicio and fecha_inicio < timezone.now():
            raise serializers.ValidationError(
                {"fecha_inicio": "No se pueden crear eventos en el pasado."}
            )

        return attrs

    # === Creación personalizada ===
    def create(self, validated_data):
        """
        Crea un evento asignando automáticamente el organizador
        a partir del usuario autenticado en el contexto de la petición.
        """
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['organizador'] = request.user
        return Evento.objects.create(**validated_data)
