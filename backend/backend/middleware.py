"""
Middleware personalizado para agregar headers de seguridad adicionales.
Incluye Content Security Policy (CSP) y otras protecciones.
"""
from django.conf import settings
from django.utils.deprecation import MiddlewareMixin


class SecurityHeadersMiddleware(MiddlewareMixin):
    """
    Middleware para agregar headers de seguridad adicionales,
    incluyendo Content Security Policy (CSP).
    """
    
    def process_response(self, request, response):
        # Agregar Content Security Policy
        if hasattr(settings, 'CSP_HEADER'):
            response['Content-Security-Policy'] = settings.CSP_HEADER
        
        # Agregar Referrer Policy
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        # Agregar Permissions Policy (anteriormente Feature Policy)
        response['Permissions-Policy'] = (
            'geolocation=(), '
            'microphone=(), '
            'camera=(), '
            'payment=(), '
            'usb=(), '
            'magnetometer=(), '
            'gyroscope=(), '
            'speaker=()'
        )
        
        return response

