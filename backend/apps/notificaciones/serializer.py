from rest_framework import serializers
from .models import Notificacion, UsuarioNotificacion

class NotificacionSerializer(serializers.ModelSerializer):
    """
    Serializador para el modelo Notificacion.
    Solo lectura (GET).
    """
    evento_titulo = serializers.CharField(source='evento.titulo', read_only=True)
    evento_id = serializers.IntegerField(source='evento.id', read_only=True)
    leida = serializers.SerializerMethodField()
    
    class Meta:
        model = Notificacion
        fields = [
            'id',
            'tipo',
            'etiqueta',
            'mensaje',
            'fecha_envio',
            'evento_id',
            'evento_titulo',
            'leida'
        ]
        read_only_fields = [
            'id',
            'tipo',
            'etiqueta',
            'mensaje',
            'fecha_envio',
            'evento_id',
            'evento_titulo',
            'leida'
        ]
    
    def get_leida(self, obj):
        """
        Obtiene el estado de lectura desde UsuarioNotificacion.
        """
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            usuario_notificacion = UsuarioNotificacion.objects.filter(
                usuario=request.user,
                notificacion=obj
            ).first()
            return usuario_notificacion.leida if usuario_notificacion else False
        return False