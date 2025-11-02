from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework import exceptions

class CookieJWTAuthentication(JWTAuthentication):
    """
    Clase de autenticación personalizada que lee el JWT 'access' token
    desde una cookie HttpOnly llamada 'access'.
    """
    
    def authenticate(self, request):
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