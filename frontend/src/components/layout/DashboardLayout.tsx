import { Outlet } from 'react-router-dom';
import { DashboardWebSocketProvider } from '@/contexts/Dashb';
import FloatingNotificationButton from '@/components/notifications/FloatingNotificationButton';

const DashboardLayout = () => {
    return (
        <DashboardWebSocketProvider>
            {/* Outlet renderiza las rutas hijas del dashboard */}
            <Outlet />
            {/* Botón flotante de notificaciones visible en todo el dashboard */}
            <FloatingNotificationButton />
        </DashboardWebSocketProvider>
    );
};

export default DashboardLayout;