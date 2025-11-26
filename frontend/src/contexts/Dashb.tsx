import React, { createContext, useContext } from 'react';
import { useDashboardWebSocket } from '@/hooks/use-dashboard-web-socket';

// 1. Crear el contexto
// El tipo es lo que retorna useDashboardWebSocket
const DashboardWebSocketContext = createContext<ReturnType<typeof useDashboardWebSocket> | null>(null);

// 2. Provider: Componente que provee el valor del hook
export const DashboardWebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Ejecutar el hook aquí
    // Esto crea la conexión WebSocket cuando el Provider se monta
    const websocket = useDashboardWebSocket();

    // Proveer el valor a todos los componentes hijos
    return (
        <DashboardWebSocketContext.Provider value={websocket}>
            {children}
        </DashboardWebSocketContext.Provider>
    );
};

// 3. Hook personalizado para usar el contexto fácilmente
export const useDashboardWebSocketContext = () => {
    const context = useContext(DashboardWebSocketContext);
    
    // Si el contexto es null, significa que se está usando fuera del Provider
    if (!context) {
        throw new Error('useDashboardWebSocketContext debe usarse dentro de DashboardWebSocketProvider');
    }
    
    return context;
};