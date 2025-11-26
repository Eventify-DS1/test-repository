from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Usuario, Rol, MFACode, PasswordResetCode, LoginAttempt

@admin.register(Rol)
class RolAdmin(admin.ModelAdmin):
    list_display = ['nombre']
    search_fields = ['nombre']

@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    # Campos adicionales que se mostrarán en el admin
    list_display = ['username', 'email', 'first_name', 'last_name', 'rol', 'codigo_estudiantil', 'carrera', 'facultad']
    list_filter = ['rol', 'carrera', 'facultad']
    search_fields = ['username', 'email', 'first_name', 'last_name', 'carrera', 'facultad', 'codigo_estudiantil']
    
    # Campos que se pueden editar
    fieldsets = UserAdmin.fieldsets + (
        ('Información adicional', {
            'fields': ('carrera', 'facultad', 'foto', 'codigo_estudiantil', 'rol')
        }),
        ('Seguridad', {
            'fields': ('mfa_enabled', 'mfa_secret')
        }),
    )
    
    # Campos para crear nuevo usuario
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Información adicional', {
            'fields': ('email', 'carrera', 'facultad', 'codigo_estudiantil', 'rol')
        }),
    )

@admin.register(MFACode)
class MFACodeAdmin(admin.ModelAdmin):
    list_display = ['usuario', 'codigo', 'session_id', 'creado_en', 'usado', 'intentos']
    list_filter = ['usado', 'creado_en']
    search_fields = ['usuario__username', 'usuario__email', 'session_id', 'codigo']
    readonly_fields = ['codigo', 'session_id', 'creado_en']
    
    def has_add_permission(self, request):
        return False  # Los códigos solo se generan automáticamente

@admin.register(PasswordResetCode)
class PasswordResetCodeAdmin(admin.ModelAdmin):
    list_display = ['usuario', 'codigo', 'session_id', 'creado_en', 'usado', 'intentos']
    list_filter = ['usado', 'creado_en']
    search_fields = ['usuario__username', 'usuario__email', 'session_id', 'codigo']
    readonly_fields = ['codigo', 'session_id', 'creado_en']
    
    def has_add_permission(self, request):
        return False  # Los códigos solo se generan automáticamente

@admin.register(LoginAttempt)
class LoginAttemptAdmin(admin.ModelAdmin):
    list_display = ['ip_address', 'username', 'intentos', 'ultimo_intento', 'bloqueado_hasta']
    list_filter = ['bloqueado_hasta', 'ultimo_intento']
    search_fields = ['ip_address', 'username']
    readonly_fields = ['ip_address', 'username', 'intentos', 'ultimo_intento', 'creado_en']
    
    def has_add_permission(self, request):
        return False  # Los intentos se crean automáticamente
