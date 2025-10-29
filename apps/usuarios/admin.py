from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Usuario, Rol

@admin.register(Rol)
class RolAdmin(admin.ModelAdmin):
    list_display = ['nombre']
    search_fields = ['nombre']

@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    # Campos adicionales que se mostrarán en el admin
    list_display = ['username', 'email', 'first_name', 'last_name', 'rol', 'estado_cuenta', 'carrera', 'facultad']
    list_filter = ['rol', 'estado_cuenta', 'carrera', 'facultad', 'is_staff', 'is_active']
    search_fields = ['username', 'email', 'first_name', 'last_name', 'carrera', 'facultad']
    
    # Campos que se pueden editar
    fieldsets = UserAdmin.fieldsets + (
        ('Información adicional', {
            'fields': ('carrera', 'facultad', 'foto', 'estado_cuenta', 'rol')
        }),
    )
    
    # Campos para crear nuevo usuario
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Información adicional', {
            'fields': ('email', 'carrera', 'facultad', 'estado_cuenta', 'rol')
        }),
    )
