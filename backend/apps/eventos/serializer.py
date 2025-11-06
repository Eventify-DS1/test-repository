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


class OrganizadorSerializer(serializers.ModelSerializer):
    """
    Serializador simplificado para mostrar información del organizador.
    Solo incluye campos relevantes para la visualización.
    """
    nombre_completo = serializers.SerializerMethodField()
    
    class Meta:
        model = Usuario
        fields = ['id', 'username', 'first_name', 'last_name', 'nombre_completo']
        read_only_fields = ['id', 'username', 'first_name', 'last_name', 'nombre_completo']
    
    def get_nombre_completo(self, obj):
        """Retorna el nombre completo o username si no tiene nombre"""
        nombre = f"{obj.first_name} {obj.last_name}".strip()
        return nombre if nombre else obj.username


class UsuarioInscritoSerializer(serializers.ModelSerializer):
    """
    Serializador simplificado para mostrar información de usuarios inscritos.
    """
    nombre_completo = serializers.SerializerMethodField()
    
    class Meta:
        model = Usuario
        fields = ['id', 'username', 'first_name', 'last_name', 'nombre_completo']
        read_only_fields = ['id', 'username', 'first_name', 'last_name', 'nombre_completo']
    
    def get_nombre_completo(self, obj):
        """Retorna el nombre completo o username si no tiene nombre"""
        nombre = f"{obj.first_name} {obj.last_name}".strip()
        return nombre if nombre else obj.username


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
    
    # Campo para lectura (devuelve los datos del organizador)
    organizador = OrganizadorSerializer(read_only=True)

    # Número de inscritos
    numero_inscritos = serializers.SerializerMethodField()
    
    # Lista de usuarios inscritos (solo nombres)
    inscritos = serializers.SerializerMethodField()

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
            'organizador',  # Para lectura (devuelve objeto con nombre)
            'categoria',
            'categoria_id',
            'numero_inscritos',  # Número total de inscritos
            'inscritos',  # Lista de usuarios inscritos con nombres
        ]
    
    def get_numero_inscritos(self, obj):
        """Retorna el número de inscritos en el evento"""
        return obj.inscripciones.count()
    
    def get_inscritos(self, obj):
        """Retorna la lista de usuarios inscritos con sus nombres"""
        inscripciones = obj.inscripciones.select_related('usuario').all()
        return UsuarioInscritoSerializer([inscripcion.usuario for inscripcion in inscripciones], many=True).data

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
       # Crea un evento asignando automáticamente el organizador
       # a partir del usuario autenticado en el contexto de la petición.
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['organizador'] = request.user
        return Evento.objects.create(**validated_data)

    

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
        request = self.context.get('request')
        usuario = request.user if request and hasattr(request, 'user') else attrs.get('usuario')
        evento = attrs.get('evento')
        if usuario and evento and Inscripcion.objects.filter(usuario=usuario, evento=evento).exists():
            raise serializers.ValidationError("Este usuario ya está inscrito en el evento.")
        return attrs

    

class InscripcionDetalleSerializer(serializers.ModelSerializer):
    usuario = UsuarioSerializer(read_only=True)
    evento = EventoSerializer(read_only=True)

    class Meta:
        model = Inscripcion
        fields = ['id', 'usuario', 'evento', 'fecha_inscripcion']

class EstadisticasEventosSerializer(serializers.ModelSerializer):
    """
    Serializador para estadísticas de eventos.
    Extiende del modelo Evento para tener acceso a las consultas.
    """
    total_eventos = serializers.SerializerMethodField()
    eventos_proximos = serializers.SerializerMethodField()

    class Meta:
        model = Evento
        fields = ['total_eventos', 'eventos_proximos']

    def get_total_eventos(self, obj):
        """
        Retorna el total de eventos en el sistema.
        """
        return Evento.objects.count()

    def get_eventos_proximos(self, obj):
        """
        Retorna el número de eventos con fecha_inicio >= hoy.
        """
        return Evento.objects.filter(fecha_inicio__gte=timezone.now()).count()

class EstadisticasCategoriasSerializer(serializers.ModelSerializer):
    """
    Serializador para estadísticas de categorías.
    Extiende del modelo CategoriaEvento para tener acceso a las consultas.
    """
    total_categorias = serializers.SerializerMethodField()

    class Meta:
        model = CategoriaEvento
        fields = ['total_categorias']

    def get_total_categorias(self, obj):
        """
        Retorna el total de categorías en el sistema.
        """
        return CategoriaEvento.objects.count()

