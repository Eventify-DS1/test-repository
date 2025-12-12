from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Notificacion, UsuarioNotificacion
from .serializer import NotificacionSerializer

class NotificacionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para notificaciones.
    Solo permite lectura (GET): list y retrieve.
    Solo muestra las notificaciones del usuario autenticado.
    """
    serializer_class = NotificacionSerializer
    permission_classes = [IsAuthenticated]
    
    # 🔍 Búsqueda textual (por nombre del evento)
    search_fields = ['evento__titulo', 'mensaje']
    
    # 🔢 Ordenamiento
    ordering_fields = ['fecha_envio', 'leida']
    ordering = ['-fecha_envio']  # Más recientes primero
    
    def get_queryset(self):
        """
        Retorna solo las notificaciones del usuario autenticado.
        Filtra a través de la tabla UsuarioNotificacion para obtener
        solo las notificaciones asociadas al usuario.
        """
        usuario = self.request.user
        
        # Obtener las notificaciones del usuario a través de UsuarioNotificacion
        # Usamos select_related para optimizar las consultas
        return Notificacion.objects.filter(
            destinatarios__usuario=usuario
        ).select_related('evento').distinct().order_by('-fecha_envio')
    
    @action(detail=True, methods=['patch'])
    def leer(self, request, pk=None):
        """
        Endpoint personalizado para marcar una notificación como leída.
        PATCH /api/notifications-utils/notificaciones/{id}/leer/
        """
        notificacion = self.get_object()
        
        try:
            usuario_notificacion = UsuarioNotificacion.objects.get(
                usuario=request.user,
                notificacion=notificacion
            )
            usuario_notificacion.leida = True
            usuario_notificacion.save()
            
            return Response({
                'detail': 'Notificación marcada como leída',
                'leida': True
            }, status=status.HTTP_200_OK)
        except UsuarioNotificacion.DoesNotExist:
            return Response(
                {'detail': 'No tienes acceso a esta notificación'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    # Deshabilitar create, update, destroy
    def create(self, request, *args, **kwargs):
        return Response(
            {'detail': 'No se permite crear notificaciones mediante este endpoint.'},
            status=405
        )
    
    def update(self, request, *args, **kwargs):
        return Response(
            {'detail': 'No se permite actualizar notificaciones mediante este endpoint.'},
            status=405
        )
    
    def destroy(self, request, *args, **kwargs):
        return Response(
            {'detail': 'No se permite eliminar notificaciones mediante este endpoint.'},
            status=405
        )
    
    @action(detail=False, methods=['get'])
    def conteo(self, request):
        """
        Endpoint para obtener el conteo de notificaciones del usuario.
        Retorna el total de notificaciones y el total de no leídas.
        GET /api/notifications-utils/notificaciones/conteo/
        """
        usuario = request.user
        
        # Obtener todas las notificaciones del usuario
        notificaciones = Notificacion.objects.filter(
            destinatarios__usuario=usuario
        ).distinct()
        
        # Contar total y no leídas
        total = notificaciones.count()
        
        # Contar no leídas usando UsuarioNotificacion
        no_leidas = UsuarioNotificacion.objects.filter(
            usuario=usuario,
            leida=False
        ).count()
        
        return Response({
            'total': total,
            'no_leidas': no_leidas,
            'leidas': total - no_leidas
        }, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['delete'])
    def eliminar(self, request, pk=None):
        """
        Endpoint personalizado para eliminar una notificación del usuario.
        Elimina el registro UsuarioNotificacion, no la Notificacion en sí.
        DELETE /api/notifications-utils/notificaciones/{id}/eliminar/
        """
        notificacion = self.get_object()
        
        try:
            usuario_notificacion = UsuarioNotificacion.objects.get(
                usuario=request.user,
                notificacion=notificacion
            )
            usuario_notificacion.delete()
            
            return Response({
                'detail': 'Notificación eliminada correctamente'
            }, status=status.HTTP_200_OK)
        except UsuarioNotificacion.DoesNotExist:
            return Response(
                {'detail': 'No tienes acceso a esta notificación'},
                status=status.HTTP_404_NOT_FOUND
            )