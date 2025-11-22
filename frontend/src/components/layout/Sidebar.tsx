import { NavLink, useNavigate } from "react-router-dom";
import { Home, Search, Plus, FileText, Bell, Star, User, LogOut, Loader2 } from "lucide-react";
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
  { icon: Search, label: "Buscar eventos", path: "/dashboard/search" },
  { icon: Plus, label: "Crear evento", path: "/dashboard/create" },
  { icon: FileText, label: "Mis reportes", path: "/dashboard/reports", disabled: true },
  { icon: Bell, label: "Notificaciones", path: "/dashboard/notifications", disabled: true },
  { icon: Star, label: "Calificar eventos", path: "/dashboard/rate", disabled: true },
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
    <aside className="w-64 border-r bg-muted/30 h-screen sticky top-0 flex flex-col">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <img src="/branding/logo.png" alt="Eventify" className="h-10 w-auto" />
        </div>
        
        <nav className="space-y-2">
          {menuItems.map((item) => {
            if (item.disabled) {
              return (
                <div
                  key={item.path}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground/60 bg-muted/40 cursor-not-allowed opacity-60"
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
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
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-base text-sm font-medium",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-card"
                      : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon className={cn("h-5 w-5", isActive && "animate-pulse")} />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-6">
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
