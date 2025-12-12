from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from jwt import decode as jwt_decode
from django.conf import settings
import json


User = get_user_model()



class NotificationConsumer(AsyncWebsocketConsumer):
    """
    Consumer para notificaciones en tiempo real.
    Autentica usuarios mediante JWT y los conecta a un grupo único por usuario.
    """

    async def connect(self):
        """
        Conecta al usuario autenticado a su grupo personal de notificaciones.
        El JWT puede venir en:
        - Query string: ?token=xxx
        - Cookies: access cookie
        """
        self.user = None
        self.group_name = None
        
        cookies = self.scope.get('cookies', {})
        token = cookies.get('access')

        try:
            user = await self.get_user_from_token(token)
            if user is None:
                print("❌ Conexión rechazada: Token inválido o usuario no encontrado")
                await self.close(code=4003)  # Código de cierre: token inválido
                return

            self.user = user
            # Crear grupo único para este usuario
            self.group_name = f"user_{user.id}"
            
            # Unir al usuario a su grupo personal
            await self.channel_layer.group_add(
                self.group_name,
                self.channel_name
            )

            await self.accept()
            print(f"✅ Usuario {user.username} (ID: {user.id}) conectado al grupo: {self.group_name}")
        
            await self.send(text_data=json.dumps({
                'type': 'connection_established',
                'message': 'Conectado exitosamente',
                'user_id': user.id,
                'username': user.username
            }))

        except Exception as e:
            print(f"❌ Error al conectar: {str(e)}")
            await self.close(code=4002)  # Código de cierre: error de servidor
    


    async def disconnect(self, close_code):
        """
        Desconecta al usuario de su grupo cuando cierra la conexión.
        """
        if self.group_name and self.user:
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )
            print(f"🔌 Usuario {self.user.username} (ID: {self.user.id}) desconectado del grupo: {self.group_name}")
            
    async def receive(self, text_data=None, bytes_data=None):
        pass

    """
    Mientras no tenga que recibir nada, no necesito este método. Puede ser inseguro.
    async def receive(self, text_data=None, bytes_data=None):
        Maneja mensajes recibidos del cliente (opcional, para ping/pong o comandos).
        
        if text_data:
            try:
                data = json.loads(text_data)
                message_type = data.get('type')
                
                if message_type == 'ping':
                    # Responder con pong para mantener la conexión viva
                    await self.send(text_data=json.dumps({
                        'type': 'pong',
                        'timestamp': data.get('timestamp')
                    }))
            except json.JSONDecodeError:
                pass
    """

    async def send_notification(self, event):
        """
        Método llamado cuando se envía una notificación al grupo del usuario.
        Este método será invocado por Celery o cualquier otro proceso.
        """
        print(f"🔔 [CONSUMER] send_notification llamado")
        print(f"🔔 [CONSUMER] Usuario: {self.user.username if hasattr(self, 'user') else 'desconocido'}")
        print(f"🔔 [CONSUMER] Grupo: {self.group_name if hasattr(self, 'group_name') else 'desconocido'}")
        
        notification_data = event.get('notification', {})
        print(f"🔔 [CONSUMER] Datos recibidos: {notification_data}")
        
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'data': notification_data
        }))
        print(f"✅ [CONSUMER] Mensaje enviado al WebSocket")

    @database_sync_to_async
    def get_user_from_token(self, token):
        """
        Valida el token JWT y retorna el usuario asociado.
        """
            if not token:
                print("❌ [get_user_from_token] Token no encontrado en cookies")
                return None

            print(f"🧐 [get_user_from_token] Validando token. Tipo: {type(token)}")

            # Asegurar que el token saa compatible (algunas versiones de JWT piden bytes)
            # Pero normalmente SimpleJWT maneja strings.
            try:
                UntypedToken(token)
            except Exception as e:
                # Si falla, intentar encodeo a bytes por si acaso
                print(f"⚠️ Falló validación inicial: {e}. Intentando con bytes...")
                if isinstance(token, str):
                    UntypedToken(token.encode('utf-8'))
            
            # Decodificar para obtener ID
            # Usar jwt.decode directamente puede ser redundante pero seguro
            decoded_data = jwt_decode(
                token,
                settings.SECRET_KEY,
                algorithms=["HS256"]
            )
            
            user_id = decoded_data.get('user_id')
            if user_id:
                try:
                    user = User.objects.get(id=user_id)
                    return user
                except User.DoesNotExist:
                    print(f"❌ Usuario con ID {user_id} no encontrado")
                    return None
            return None
            
        except (InvalidToken, TokenError) as e:
            print(f"❌ Token inválido o expirado: {str(e)}")
            return None
        except Exception as e:
            print(f"❌ Error inesperado al validar token: {str(e)}")
            return None


class PruebaConsumer(AsyncWebsocketConsumer):
    # 1. CONNECT: Cuando el usuario "descuelga el teléfono" (entra a la web)
    async def connect(self):
        # Definimos un nombre de sala fijo para la prueba
        self.group_name = "test_group"

        # Le decimos a Redis: "Une este cable al grupo 'test_group'"
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )

        # Respondemos "Aló" (Aceptamos la conexión)
        await self.accept()
        print(f"--- USUARIO CONECTADO AL GRUPO: {self.group_name} ---")

    # 2. DISCONNECT: Cuando el usuario "cuelga" (cierra la pestaña)
    async def disconnect(self, close_code):
        # Le decimos a Redis: "Saca este cable del grupo"
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )
        print("--- USUARIO DESCONECTADO ---")

    # 3. RECEIVE_CUSTOM: Método que llamará CELERY desde el sótano
    async def recibir_mensaje_prueba(self, event):
        # 'event' es el paquete que trajo el cartero (Redis)
        mensaje_que_llego = event['mensaje']

        # Se lo entregamos al usuario en formato JSON
        await self.send(text_data=json.dumps({
            'tipo': 'prueba_exitosa',
            'contenido': mensaje_que_llego
        }))