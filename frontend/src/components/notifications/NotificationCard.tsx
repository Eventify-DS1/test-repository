import { Bell, Calendar, Check, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { leerNotificationRequest, eliminarNotificationRequest } from "@/api/notifications";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useState } from "react";
import { toast } from "sonner";

interface NotificationCardProps {
  id: number;
  tipo: string;
  mensaje: string;
  evento_titulo?: string;
  evento_id?: number;
  fecha_envio: string;
  leida: boolean;
  onMarkAsRead?: (id: number) => void;
  onDelete?: (id: number) => void;
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
  onDelete,
}: NotificationCardProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleMarkAsRead = async (e?: React.MouseEvent) => {
    // Prevenir que se propague el evento si viene de los botones
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
      toast.success("Notificación marcada como leída");
    } catch (error) {
      console.error("Error al marcar notificación como leída:", error);
      toast.error("Error al marcar la notificación como leída");
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await eliminarNotificationRequest(id);
      if (onDelete) {
        onDelete(id);
      }
      toast.success("Notificación eliminada");
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error al eliminar notificación:", error);
      toast.error("Error al eliminar la notificación");
    } finally {
      setIsDeleting(false);
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
    <>
      <Card
        className={`relative transition-all hover:shadow-md ${
          !leida 
            ? "bg-primary/5 border-primary/20" 
            : "bg-background"
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
              
              <p className="text-xs text-muted-foreground mb-3">
                {formattedDate}
              </p>

              {/* Botones de acción */}
              <div className="flex items-center gap-2">
                {!leida && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkAsRead(e);
                    }}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Leer
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteDialog(true);
                  }}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Eliminar
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Diálogo de confirmación para eliminar */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar notificación?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La notificación será eliminada permanentemente de tu lista.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default NotificationCard;

