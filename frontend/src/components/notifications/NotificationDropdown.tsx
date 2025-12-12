import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import NotificationCard from "./NotificationCard";
import { getAllNotificationsRequest, getNotificationCountRequest } from "@/api/notifications";

interface Notification {
  id: number;
  tipo: string;
  mensaje: string;
  evento_titulo?: string;
  evento_id?: number;
  fecha_envio: string;
  leida: boolean;
}

interface NotificationDropdownProps {
  children?: React.ReactNode;
}

const NotificationDropdown = ({ children }: NotificationDropdownProps) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Función para obtener el conteo de notificaciones no leídas
  const fetchNotificationCount = useCallback(async () => {
    try {
      const response = await getNotificationCountRequest();
      const { no_leidas } = response.data;
      setUnreadCount(no_leidas || 0);
    } catch (error) {
      console.error("Error al obtener conteo de notificaciones:", error);
      setUnreadCount(0);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getAllNotificationsRequest({
        page_size: 20,
        ordering: "-fecha_envio",
      });
      
      // Manejar respuesta paginada o directa
      const data = response.data.results || response.data;
      const notificationsList = Array.isArray(data) ? data : [];
      setNotifications(notificationsList);
      setUnreadCount(notificationsList.filter((n: Notification) => !n.leida).length);
    } catch (error) {
      console.error("Error al obtener notificaciones:", error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar el conteo de notificaciones al montar el componente
  useEffect(() => {
    fetchNotificationCount();
  }, [fetchNotificationCount]);

  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open, fetchNotifications]);

  // Escuchar eventos de nuevas notificaciones desde WebSocket
  useEffect(() => {
    const handleNewNotification = () => {
      // Recargar conteo y notificaciones cuando llegue una nueva por WebSocket
      fetchNotificationCount();
      if (open) {
        fetchNotifications();
      }
    };

    window.addEventListener('newNotification', handleNewNotification);
    
    return () => {
      window.removeEventListener('newNotification', handleNewNotification);
    };
  }, [fetchNotifications, fetchNotificationCount, open]);

  const handleMarkAsRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === id ? { ...notif, leida: true } : notif
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleDelete = (id: number) => {
    setNotifications((prev) => {
      const deleted = prev.find((notif) => notif.id === id);
      const newNotifications = prev.filter((notif) => notif.id !== id);
      // Si la notificación eliminada no estaba leída, reducir el conteo
      if (deleted && !deleted.leida) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      return newNotifications;
    });
    // Actualizar el conteo después de eliminar
    fetchNotificationCount();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children ? (
          <div className="relative">
            {children}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-bold border-2 border-background">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label="Notificaciones"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>
        )}
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-0" align="end" side="top" sideOffset={8}>
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Notificaciones</h3>
            {unreadCount > 0 && (
              <span className="text-sm text-muted-foreground">
                {unreadCount} sin leer
              </span>
            )}
          </div>
        </div>
        
        <ScrollArea className="h-[400px]">
          <div className="p-2 space-y-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Bell className="h-12 w-12 text-muted-foreground mb-2 opacity-50" />
                <p className="text-sm text-muted-foreground">
                  No tienes notificaciones
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  {...notification}
                  onMarkAsRead={handleMarkAsRead}
                  onDelete={handleDelete}
                />
              ))
            )}
          </div>
        </ScrollArea>
        
        {notifications.length > 0 && (
          <div className="p-2 border-t">
            <Button
              variant="ghost"
              className="w-full text-sm"
              onClick={() => {
                setOpen(false);
                navigate("/dashboard/notifications");
              }}
            >
              Ver todas las notificaciones
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default NotificationDropdown;

