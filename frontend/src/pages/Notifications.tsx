import { useState, useEffect, useCallback } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import NotificationCard from "@/components/notifications/NotificationCard";
import { getAllNotificationsRequest } from "@/api/notifications";

interface Notification {
  id: number;
  tipo: string;
  mensaje: string;
  evento_titulo?: string;
  evento_id?: number;
  fecha_envio: string;
  leida: boolean;
}

const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetchNotifications = useCallback(async (pageNum: number = 1) => {
    setLoading(true);
    try {
      const response = await getAllNotificationsRequest({
        page: pageNum,
        page_size: 20,
        ordering: "-fecha_envio",
      });
      
      // Manejar respuesta paginada
      const data = response.data.results || response.data;
      const notificationsList = Array.isArray(data) ? data : [];
      
      if (pageNum === 1) {
        setNotifications(notificationsList);
      } else {
        setNotifications((prev) => [...prev, ...notificationsList]);
      }
      
      // Verificar si hay más páginas
      setHasMore(response.data.next ? true : false);
    } catch (error) {
      console.error("Error al obtener notificaciones:", error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications(1);
  }, [fetchNotifications]);

  // Escuchar eventos de nuevas notificaciones desde WebSocket
  useEffect(() => {
    const handleNewNotification = () => {
      // Recargar notificaciones cuando llegue una nueva por WebSocket
      fetchNotifications(1);
    };

    window.addEventListener('newNotification', handleNewNotification);
    
    return () => {
      window.removeEventListener('newNotification', handleNewNotification);
    };
  }, [fetchNotifications]);

  const handleMarkAsRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === id ? { ...notif, leida: true } : notif
      )
    );
  };

  const handleDelete = (id: number) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNotifications(nextPage);
  };

  const unreadCount = notifications.filter((n) => !n.leida).length;

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      
      <main className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Notificaciones</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 
              ? `${unreadCount} notificación${unreadCount > 1 ? 'es' : ''} sin leer`
              : "Todas tus notificaciones"}
          </p>
        </div>

        <div className="max-w-4xl space-y-4">
          {loading && notifications.length === 0 ? (
            <Card className="shadow-card">
              <CardContent className="p-12 text-center">
                <Loader2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
                <p className="text-muted-foreground">Cargando notificaciones...</p>
              </CardContent>
            </Card>
          ) : notifications.length === 0 ? (
            <Card className="shadow-card">
              <CardContent className="p-12 text-center">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">
                  No tienes notificaciones
                </h3>
                <p className="text-muted-foreground mb-4">
                  Inscríbete a eventos para recibir recordatorios
                </p>
                <Button asChild className="gradient-primary text-white border-0">
                  <Link to="/dashboard/search">Buscar eventos</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {notifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  {...notification}
                  onMarkAsRead={handleMarkAsRead}
                  onDelete={handleDelete}
                />
              ))}
              
              {hasMore && (
                <div className="flex justify-center pt-4">
                  <Button
                    variant="outline"
                    onClick={handleLoadMore}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Cargando...
                      </>
                    ) : (
                      "Cargar más notificaciones"
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Notifications;
