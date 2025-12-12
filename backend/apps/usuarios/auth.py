from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework import exceptions

class CookieJWTAuthentication(JWTAuthentication):
    """
    Clase de autenticación personalizada que lee el JWT 'access' token
    desde el header Authorization o cookie HttpOnly llamada 'access' (fallback).
    """
    
    def authenticate(self, request):
        # Primero intentar obtener el token del header Authorization (localStorage)
        header = self.get_header(request)
        if header is not None:
            raw_token = self.get_raw_token(header)
        else:
            # Fallback: obtener de cookie si no está en header
            raw_token = request.COOKIES.get('access')
        
        if raw_token is None:
            return None
        
        try:
            validated_token = self.get_validated_token(raw_token)
            
            return self.get_user(validated_token), validated_token
        
        except exceptions.AuthenticationFailed as e: 
            return None
        except Exception as e:
            return None 