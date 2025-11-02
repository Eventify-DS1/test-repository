from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsAdmin(BasePermission):
    """
    Permiso personalizado para verificar si el usuario tiene el rol 'admin'.
    """
    message = "Acción no permitida. Se requiere rol de administrador."

    def has_permission(self, request, view):
        # Asegurarnos de que el usuario está autenticado
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Verificar si el rol del usuario es 'admin'
        # Usamos .lower() por seguridad
        try:
            return request.user.rol.nombre.lower() == 'admin'
        except AttributeError:
            # Maneja el caso de que el usuario no tenga rol (ej. superusuario de Django)
            # Si el superusuario de Django debe ser admin, puedes añadir:
            # return request.user.is_superuser or ...
            return False

class IsOwnerOrAdmin(BasePermission):
    """
    Permite la acción solo si el usuario es el dueño del objeto
    o si es un Administrador.
    """
    message = "No tienes permiso para realizar esta acción sobre este objeto."

    def has_object_permission(self, request, view, obj):
        """
        Esta función se llama para acciones de detalle (GET, PUT, DELETE /id/)
        'obj' es la instancia del modelo (en este caso, un 'Usuario').
        """
        
        # Si el usuario es admin, tiene permiso
        try:
            if request.user.rol.nombre.lower() == 'admin':
                return True
        except AttributeError:
            pass # Continuar para verificar si es el dueño
        
        # 'obj' es el perfil de usuario que se está intentando ver/editar.
        # 'request.user' es el usuario que está haciendo la petición.
        return obj == request.user