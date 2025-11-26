import { Bell, Calendar, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { leerNotificationRequest } from "@/api/notifications";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface NotificationCardProps {
  id: number;
  tipo: string;
  mensaje: string;
  evento_titulo?: string;
  evento_id?: number;
  fecha_envio: string;
  leida: boolean;
  onMarkAsRead?: (id: number) => void;
}

const NotificationCard = ({
  id,
  tipo,
  mensaje,
  evento_titulo,
  evento_id,
  fecha_envio,
  leida,
  onMarkAsRead,
}: NotificationCardProps) => {
  const handleMarkAsRead = async (e?: React.MouseEvent) => {
    // Prevenir que se propague el evento si viene del botón X
    if (e) {
      e.stopPropagation();
    }
    
    // Solo marcar como leída si no está ya leída
    if (leida) return;
    
    try {
      await leerNotificationRequest(id);
      if (onMarkAsRead) {
        onMarkAsRead(id);
      }
    } catch (error) {
      console.error("Error al marcar notificación como leída:", error);
    }
  };

  const formattedDate = format(new Date(fecha_envio), "PPp", { locale: es });

  const getTipoColor = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case "recordatorio":
        return "bg-blue-500/20 text-blue-700 dark:text-blue-300";
      case "evento":
        return "bg-green-500/20 text-green-700 dark:text-green-300";
      case "sistema":
        return "bg-purple-500/20 text-purple-700 dark:text-purple-300";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Card
      onClick={handleMarkAsRead}
      className={`relative transition-all hover:shadow-md ${
        !leida 
          ? "bg-primary/5 border-primary/20 cursor-pointer hover:bg-primary/10" 
          : "bg-background cursor-default"
      }`}
    >
      {!leida && (
        <div className="absolute top-2 right-2">
          <div className="h-2 w-2 bg-primary rounded-full" />
        </div>
      )}
      
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-full ${getTipoColor(tipo)}`}>
            <Bell className="h-4 w-4" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <Badge variant="outline" className={getTipoColor(tipo)}>
                {tipo}
              </Badge>
              {!leida && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => handleMarkAsRead(e)}
                  title="Marcar como leída"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            
            <p className="text-sm font-medium text-foreground mb-1">
              {mensaje}
            </p>
            
            {evento_titulo && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                <Calendar className="h-3 w-3" />
                <span className="font-medium">{evento_titulo}</span>
              </div>
            )}
            
            <p className="text-xs text-muted-foreground">
              {formattedDate}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationCard;

