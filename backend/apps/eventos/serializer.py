from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from django.utils import timezone
from .models import Evento, CategoriaEvento, Inscripcion
from apps.usuarios.models import Usuario
from apps.usuarios.serializer import UsuarioSerializer

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

    """
    Cuando tengamos hecho la autenticacion, descomentar el campo de solo lectura
    # Campo de solo lectura: muestra el nombre del organizador (relación con Usuario)
    organizador = serializers.StringRelatedField(read_only=True)
    """
        
    organizador = serializers.PrimaryKeyRelatedField(queryset=Usuario.objects.all())

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
    """
    Cuando tengamos hecho la autenticacion, descomentar el metodo
    def create(self, validated_data):
        
        Crea un evento asignando automáticamente el organizador
        a partir del usuario autenticado en el contexto de la petición.
        
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['organizador'] = request.user
        return Evento.objects.create(**validated_data)

    """

    # ==========================================================
    # Si hay sesión, probar con lo siguiente:
    #
    # 1) Marcar el organizador como solo lectura (no enviarlo en el payload)
    # 2) Forzar en create() que se tome del request.user autenticado
    #
    # Para activarlo, comenta el campo actual de "organizador" y descomenta
    # las líneas siguientes. No olvides exigir autenticación en la vista.
    #
    # organizador = serializers.StringRelatedField(read_only=True)
    #
    # def create(self, validated_data):
    #     request = self.context.get('request')
    #     if not request or not getattr(request.user, 'is_authenticated', False):
    #         raise serializers.ValidationError({
    #             'detail': 'Debe estar autenticado para crear eventos sin enviar organizador.'
    #         })
    #     validated_data['organizador'] = request.user
    #     return Evento.objects.create(**validated_data)
    #
    # Alternativa en la vista (perform_create):
    #
    # class EventoViewSet(viewsets.ModelViewSet):
    #     permission_classes = [IsAuthenticated]
    #     def perform_create(self, serializer):
    #         serializer.save(organizador=self.request.user)
    # ==========================================================

class InscripcionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Inscripcion
        fields = ['id', 'usuario', 'evento', 'fecha_inscripcion']
        read_only_fields = ['fecha_inscripcion']

    def create(self,validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['usuario'] = request.user
        return Inscripcion.objects.create(**validated_data)

    def validate(self, attrs):
        usuario = attrs.get('usuario')
        evento = attrs.get('evento')
        if Inscripcion.objects.filter(usuario=usuario, evento=evento).exists():
            raise serializers.ValidationError("Este usuario ya está inscrito en el evento.")
        return attrs
    

class InscripcionDetalleSerializer(serializers.ModelSerializer):
    usuario = UsuarioSerializer(read_only=True)
    evento = EventoSerializer(read_only=True)

    class Meta:
        model = Inscripcion
        fields = ['id', 'usuario', 'evento', 'fecha_inscripcion']

