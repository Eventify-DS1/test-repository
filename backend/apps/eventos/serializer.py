from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from django.utils import timezone
from .models import Evento, CategoriaEvento, Inscripcion, Reseña
from apps.usuarios.models import Usuario
from apps.usuarios.serializer import UsuarioSerializer
from backend.security_utils import sanitize_text, sanitize_html

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
    
    def validate_nombre(self, value):
        """Sanitiza el nombre de la categoría para prevenir XSS"""
        if value:
            return sanitize_text(value, max_length=50)
        return value


class OrganizadorSerializer(serializers.ModelSerializer):
    """
    Serializador simplificado para mostrar información del organizador.
    Solo incluye campos relevantes para la visualización.
    """
    nombre_completo = serializers.SerializerMethodField()
    
    class Meta:
        model = Usuario
        fields = ['id', 'username', 'first_name', 'last_name', 'nombre_completo', 'foto']
        read_only_fields = ['id', 'username', 'first_name', 'last_name', 'nombre_completo']
    
    def get_nombre_completo(self, obj):
        """Retorna el nombre completo o username si no tiene nombre"""
        nombre = f"{obj.first_name} {obj.last_name}".strip()
        return nombre if nombre else obj.username


class UsuarioInscritoSerializer(serializers.ModelSerializer):
    """
    Serializador simplificado para mostrar información de usuarios inscritos.
    Incluye email y codigo_estudiantil solo si el usuario que solicita es el organizador del evento.
    """
    nombre_completo = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()
    codigo_estudiantil = serializers.SerializerMethodField()
    
    class Meta:
        model = Usuario
        fields = ['id', 'username', 'first_name', 'last_name', 'nombre_completo', 'email', 'codigo_estudiantil', 'foto']
        read_only_fields = ['id', 'username', 'first_name', 'last_name', 'nombre_completo', 'email', 'codigo_estudiantil', 'foto']
    
    def get_nombre_completo(self, obj):
        """Retorna el nombre completo o username si no tiene nombre"""
        nombre = f"{obj.first_name} {obj.last_name}".strip()
        return nombre if nombre else obj.username
    
    def get_email(self, obj):
        """Retorna el email solo si el usuario que solicita es el organizador"""
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            # Verificar si el usuario es el organizador del evento
            evento = self.context.get('evento')
            if evento and evento.organizador == request.user:
                return obj.email
        return None
    
    def get_codigo_estudiantil(self, obj):
        """Retorna el código estudiantil solo si el usuario que solicita es el organizador"""
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            # Verificar si el usuario es el organizador del evento
            evento = self.context.get('evento')
            if evento and evento.organizador == request.user:
                return obj.codigo_estudiantil
        return None


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
    
    # Código de confirmación (solo visible para el organizador)
    codigo_confirmacion = serializers.SerializerMethodField()
    
    # Indica si el evento está marcado como favorito por el usuario autenticado
    is_favorito = serializers.SerializerMethodField()

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
            'codigo_confirmacion',  # Código de confirmación (solo para organizador)
            'is_favorito',  # Indica si el evento es favorito del usuario
        ]
    
    def to_representation(self, instance):
        """
        Sobrescribe la representación para manejar URLs de foto correctamente.
        - En Cloudinary: devuelve URL completa (https://res.cloudinary.com/...)
        - En desarrollo local: devuelve ruta relativa (/media/...)
        """
        try:
            representation = super().to_representation(instance)
            foto_url = representation.get('foto')
            
            if foto_url and isinstance(foto_url, str):
                # Si es Cloudinary (producción), mantener URL completa
                if 'cloudinary.com' in foto_url:
                    # Mantener la URL completa de Cloudinary
                    representation['foto'] = foto_url
                # Si es URL local de desarrollo (localhost/backend:8000)
                elif foto_url.startswith('http://') or foto_url.startswith('https://'):
                    from urllib.parse import urlparse
                    parsed = urlparse(foto_url)
                    representation['foto'] = parsed.path
                # Asegurar que rutas relativas comiencen con /
                elif foto_url and not foto_url.startswith('/'):
                    representation['foto'] = f'/{foto_url}'
            
            return representation
        except Exception as e:
            # Si hay un error en to_representation, intentar devolver la representación básica
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Error en to_representation para evento {instance.pk if hasattr(instance, 'pk') else 'nuevo'}: {str(e)}")
            # Devolver representación básica sin procesar la foto
            return super().to_representation(instance)
    
    def get_numero_inscritos(self, obj):
        """Retorna el número de inscritos en el evento"""
        # Verificar que el objeto esté guardado antes de acceder a relaciones
        if not obj.pk:
            return 0
        try:
            return obj.inscripciones.count()
        except Exception:
            return 0
    
    def get_inscritos(self, obj):
        """Retorna la lista de usuarios inscritos con sus nombres y estado de confirmación"""
        # Verificar que el objeto esté guardado antes de acceder a relaciones
        if not obj.pk:
            return []
        try:
            inscripciones = obj.inscripciones.select_related('usuario').all()
            # Pasar el contexto con el request y el evento para que el serializer pueda verificar si es organizador
            request = self.context.get('request')
            
            # Crear lista con información del usuario y estado de confirmación
            inscritos_data = []
            for inscripcion in inscripciones:
                usuario_data = UsuarioInscritoSerializer(
                    inscripcion.usuario,
                    context={'request': request, 'evento': obj}
                ).data
                # Agregar información de la inscripción
                usuario_data['asistencia_confirmada'] = inscripcion.asistencia_confirmada
                inscritos_data.append(usuario_data)
            
            return inscritos_data
        except Exception:
            return []
    
    def get_codigo_confirmacion(self, obj):
        """Retorna el código de confirmación solo si el usuario es el organizador"""
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            if obj.organizador == request.user:
                return obj.codigo_confirmacion
        return None
    
    def get_is_favorito(self, obj):
        """Retorna True si el evento está marcado como favorito por el usuario autenticado"""
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            from .models import Favorito
            return Favorito.objects.filter(usuario=request.user, evento=obj).exists()
        return False

    # === Validaciones personalizadas ===
    def validate(self, attrs):
        """
        Valida que las fechas del evento sean lógicas:
        - fecha_fin debe ser posterior a fecha_inicio.
        - fecha_inicio no puede estar en el pasado.
        También sanitiza campos de texto para prevenir XSS.
        NOTA: Esta validación solo se ejecuta al CREAR o ACTUALIZAR, no al leer.
        """
        # Solo validar si hay datos nuevos (creación o actualización)
        if not attrs:
            return attrs
        
        # Sanitizar campos de texto para prevenir XSS
        if 'titulo' in attrs and attrs['titulo']:
            attrs['titulo'] = sanitize_text(attrs['titulo'])
        if 'descripcion' in attrs and attrs['descripcion']:
            # Para descripción, permitir HTML básico pero sanitizado
            attrs['descripcion'] = sanitize_html(attrs['descripcion'])
        if 'ubicacion' in attrs and attrs['ubicacion']:
            attrs['ubicacion'] = sanitize_text(attrs['ubicacion'])
            
        fecha_inicio = attrs.get('fecha_inicio')
        fecha_fin = attrs.get('fecha_fin')

        if fecha_inicio and fecha_fin and fecha_fin < fecha_inicio:
            raise serializers.ValidationError(
                {"fecha_fin": "La fecha de fin no puede ser anterior a la fecha de inicio."}
            )

        # Solo validar fecha_inicio si se está creando un nuevo evento
        # No validar si solo se está leyendo (serializando para respuesta)
        if fecha_inicio and self.instance is None and fecha_inicio < timezone.now():
            raise serializers.ValidationError(
                {"fecha_inicio": "No se pueden crear eventos en el pasado."}
            )

        return attrs

    # === Creación personalizada ===
    
    def create(self, validated_data):
       # Crea un evento asignando automáticamente el organizador
       # a partir del usuario autenticado en el contexto de la petición.
        import logging
        logger = logging.getLogger(__name__)
        
        # Logs de diagnóstico
        logger.info(f"📝 [SERIALIZER] Creando evento con validated_data keys: {list(validated_data.keys())}")
        if 'foto' in validated_data:
            foto = validated_data['foto']
            logger.info(f"📷 [SERIALIZER] Foto recibida: {foto.name if hasattr(foto, 'name') else 'Sin nombre'}, tamaño: {foto.size if hasattr(foto, 'size') else 'desconocido'} bytes")
        else:
            logger.warning(f"⚠️ [SERIALIZER] NO se recibió foto en validated_data")
        
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['organizador'] = request.user
        
        evento = Evento.objects.create(**validated_data)
        
        # Verificar después de crear
        if evento.foto:
            logger.info(f"✅ [SERIALIZER] Evento creado con foto guardada: {evento.foto.name}")
        else:
            logger.warning(f"❌ [SERIALIZER] Evento creado PERO foto NO se guardó")
        
        return evento

    

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
        fields = ['id', 'usuario', 'evento', 'fecha_inscripcion', 'asistencia_confirmada', 'fecha_confirmacion']
        read_only_fields = ['fecha_inscripcion', 'asistencia_confirmada', 'fecha_confirmacion']

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
        fields = ['id', 'usuario', 'evento', 'fecha_inscripcion', 'asistencia_confirmada', 'fecha_confirmacion']

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



class ReseñaSerializer(serializers.ModelSerializer):
    """
    Serializador para crear y listar reseñas.
    """
    usuario = UsuarioInscritoSerializer(read_only=True)
    evento = EventoSerializer(read_only=True)
    evento_id = serializers.PrimaryKeyRelatedField(
        queryset=Evento.objects.all(),
        source='evento',
        write_only=True
    )
    
    class Meta:
        model = Reseña
        fields = [
            'id',
            'evento',
            'evento_id',
            'usuario',
            'comentario',
            'puntuacion',
            'fecha'
        ]
        read_only_fields = ['id', 'usuario', 'fecha']
    
    def validate(self, attrs):
        """
        Valida que:
        1. El usuario esté inscrito en el evento
        2. El evento haya finalizado
        3. No exista ya una reseña del usuario para este evento
        También sanitiza el comentario para prevenir XSS.
        """
        request = self.context.get('request')
        evento = attrs.get('evento')
        usuario = request.user if request and hasattr(request, 'user') else None
        
        if not usuario or not usuario.is_authenticated:
            raise serializers.ValidationError("Debes estar autenticado para crear una reseña.")
        
        # Sanitizar el comentario para prevenir XSS
        if 'comentario' in attrs and attrs['comentario']:
            attrs['comentario'] = sanitize_html(attrs['comentario'])
        
        # Verificar que el evento haya finalizado
        if evento.fecha_fin > timezone.now():
            raise serializers.ValidationError(
                {"evento": "Solo puedes calificar eventos que ya han finalizado."}
            )
        
        # Verificar que el usuario esté inscrito
        if not Inscripcion.objects.filter(usuario=usuario, evento=evento).exists():
            raise serializers.ValidationError(
                {"evento": "Solo puedes calificar eventos a los que asististe."}
            )
        
        # Verificar que no exista ya una reseña
        if Reseña.objects.filter(usuario=usuario, evento=evento).exists():
            # Si es actualización, permitir
            if self.instance:
                return attrs
            raise serializers.ValidationError(
                {"evento": "Ya has calificado este evento."}
            )
        
        # Validar que haya al menos puntuación o comentario
        puntuacion = attrs.get('puntuacion')
        comentario = attrs.get('comentario', '')
        
        if not puntuacion and not comentario:
            raise serializers.ValidationError(
                "Debes proporcionar al menos una puntuación o un comentario."
            )
        
        return attrs
    
    def create(self, validated_data):
        """Asigna automáticamente el usuario autenticado"""
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['usuario'] = request.user
        return Reseña.objects.create(**validated_data)