import { NavLink, useNavigate } from "react-router-dom";
import { Home, Search, Plus, FileText, Bell, Star, User, LogOut, Loader2, Key, Calendar, List } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { logoutRequest } from "@/api/auth";
import { toast } from "sonner";

type MenuItem = {
  icon: LucideIcon;
  label: string;
  path: string;
  disabled?: boolean;
};

const menuItems: MenuItem[] = [
  { icon: Home, label: "Inicio", path: "/dashboard" },
  { icon: List, label: "Mis eventos", path: "/dashboard/mis-eventos" },
  { icon: Search, label: "Buscar eventos", path: "/dashboard/search" },
  { icon: Calendar, label: "Calendario", path: "/dashboard/calendario" },
  { icon: Plus, label: "Crear evento", path: "/dashboard/create" },
  { icon: FileText, label: "Mis reportes", path: "/dashboard/reports", disabled: true },
  { icon: Bell, label: "Notificaciones", path: "/dashboard/notifications" },
  { icon: Key, label: "Confirmar asistencia", path: "/dashboard/confirmar-asistencia"},
  { icon: Star, label: "Calificar eventos", path: "/dashboard/rate"},
  { icon: User, label: "Perfil", path: "/dashboard/profile" },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logoutRequest();
      toast.success("Sesión cerrada correctamente");
      navigate("/login");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      toast.error("No se pudo cerrar la sesión");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <aside className="w-64 border-r bg-muted/30 h-screen sticky top-0 flex flex-col overflow-hidden">
      {/* Header con logo */}
      <div className="p-4 pb-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <img src="/branding/logo.png" alt="Eventify" className="h-10 w-auto" />
        </div>
      </div>
      
      {/* Navegación con scroll */}
      <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
        {menuItems.map((item) => {
          if (item.disabled) {
            return (
              <div
                key={item.path}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground/60 bg-muted/40 cursor-not-allowed opacity-60"
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </div>
            );
          }

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/dashboard"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2 rounded-xl transition-base text-sm font-medium",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-card"
                    : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={cn("h-4 w-4 flex-shrink-0", isActive && "animate-pulse")} />
                  <span className="truncate">{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Botón de cerrar sesión fijo en la parte inferior */}
      <div className="p-4 pt-3 border-t border-border/50 flex-shrink-0">
        <Button
          variant="outline"
          className="w-full justify-center gap-2 border-destructive text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="h-4 w-4" />
          )}
          <span>{isLoggingOut ? "Cerrando sesión" : "Cerrar sesión"}</span>
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;
