import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface Notification {
    id: number;
    tipo: string;
    mensaje: string;
    evento_id?: number;
    evento_titulo?: string;
    fecha_envio: string;
    leida: boolean;
}

export const useDashboardWebSocket = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
    const pingIntervalRef = useRef<NodeJS.Timeout>(); // ← NUEVO: Ref para el intervalo de ping
     
    useEffect(() => {
        const connectWebSocket = () => {
            // 1. Cerrar conexión existente si hay una
            if (wsRef.current) {
                wsRef.current.close();
            }
            
            // 2. Limpiar intervalo de ping anterior si existe
            if (pingIntervalRef.current) {
                clearInterval(pingIntervalRef.current);
            }
        
            // 3. Obtener la URL del WebSocket (con valor por defecto)
            // En desarrollo, usar el proxy de Vite (ws://localhost:8080/ws/notifications/)
            // En producción, usar la variable de entorno o construir desde la API URL
            const getWebSocketUrl = () => {
                // Si hay una variable de entorno definida, usarla
                if (import.meta.env.VITE_WS_URL) {
                    return import.meta.env.VITE_WS_URL;
                }
                
                // Si estamos en desarrollo, usar el proxy de Vite
                if (import.meta.env.DEV) {
                    // El protocolo será ws o wss dependiendo de si estamos en HTTPS
                    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                    return `${protocol}//${window.location.host}/ws/notifications/`;
                }
                
                // En producción, construir desde la API URL
                const apiUrl = import.meta.env.VITE_API_URL || window.location.origin;
                const wsProtocol = apiUrl.startsWith('https') ? 'wss:' : 'ws:';
                const wsHost = apiUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
                return `${wsProtocol}//${wsHost}/ws/notifications/`;
            };
            
            const wsUrl = getWebSocketUrl();
            
            // 4. Crear la conexión WebSocket
            const ws = new WebSocket(wsUrl);
            
            // 5. Guardar la referencia
            wsRef.current = ws;
            
            // Event: Conexión exitosa
            ws.onopen = () => {
                console.log('✅ Conectado al WebSocket (Dashboard)');
                setIsConnected(true);
                
                // Limpiar timeout de reconexión si existe
                if (reconnectTimeoutRef.current) {
                    clearTimeout(reconnectTimeoutRef.current);
                }
                
                // Crear intervalo de ping solo cuando está conectado
                pingIntervalRef.current = setInterval(() => {
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({
                            type: 'ping',
                            timestamp: Date.now()
                        }));
                    }
                }, 30000); // 30 segundos
            };

            // Event: Recibir mensaje
            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    
                    if (data.type === 'connection_established') {
                        console.log('✅ Conectado al WebSocket como:', data.username);
                    } else if (data.type === 'notification') {
                        console.log('🔔 Nueva notificación recibida:', data.data);
                        const notification = data.data;
                        
                        if (!notification) {
                            return;
                        }
                        
                        // Añadir notificación al estado
                        setNotifications(prev => [notification, ...prev]);
                        
                        // Emitir evento personalizado para que los componentes puedan recargar
                        window.dispatchEvent(new CustomEvent('newNotification', { 
                            detail: notification 
                        }));
                        
                        // Mostrar toast con el mensaje de recordatorio
                        toast.info(notification.mensaje || 'Nueva notificación', {
                            description: notification.evento_titulo 
                                ? `Evento: ${notification.evento_titulo}` 
                                : undefined,
                            duration: 5000,
                        });
                    } else if (data.type === 'pong') {
                        // Respuesta a ping
                    }
                } catch (error) {
                    console.error('Error al parsear mensaje WebSocket:', error);
                }
            };

            // Event: Error
            ws.onerror = (error) => {
                console.error('❌ Error en WebSocket:', error);
                setIsConnected(false);
            };

            // Event: Conexión cerrada
            ws.onclose = (event) => {
                console.log('🔌 WebSocket cerrado:', event.code);
                setIsConnected(false);
                
                // Limpiar intervalo de ping cuando se cierra
                if (pingIntervalRef.current) {
                    clearInterval(pingIntervalRef.current);
                    pingIntervalRef.current = undefined;
                }

                // Reconexión automática solo si no fue un cierre intencional
                if (event.code !== 1000) { // 1000 = cierre normal
                    if (event.code === 4001 || event.code === 4003) {
                        console.log('Conexión rechazada: Problema de autenticación');
                        return;
                    }

                    // Reconectar después de 3 segundos
                    reconnectTimeoutRef.current = setTimeout(() => {
                        console.log('🔄 Intentando reconectar...');
                        connectWebSocket();
                    }, 3000);
                }
            };
        };
        
        // Conectar al montar
        connectWebSocket();
        
        // Limpieza al desmontar
        return () => {
            // Limpiar intervalo de ping
            if (pingIntervalRef.current) {
                clearInterval(pingIntervalRef.current);
            }
            
            // Cerrar conexión WebSocket
            if (wsRef.current) {
                wsRef.current.close(1000); // 1000 = cierre normal
            }
            
            // Limpiar timeout de reconexión
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, []);

    return { 
        isConnected,
        notifications,
        setNotifications
    };
};