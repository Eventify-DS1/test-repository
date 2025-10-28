import { NavLink } from "react-router-dom";
import { Calendar, Home, Search, Plus, FileText, Bell, Star, User } from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { icon: Home, label: "Inicio", path: "/dashboard" },
  { icon: Search, label: "Buscar eventos", path: "/dashboard/search" },
  { icon: Plus, label: "Crear evento", path: "/dashboard/create" },
  { icon: FileText, label: "Mis reportes", path: "/dashboard/reports" },
  { icon: Bell, label: "Notificaciones", path: "/dashboard/notifications" },
  { icon: Star, label: "Calificar eventos", path: "/dashboard/rate" },
  { icon: User, label: "Perfil", path: "/dashboard/profile" },
];

const Sidebar = () => {
  return (
    <aside className="w-64 border-r bg-muted/30 min-h-screen flex flex-col">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
            <Calendar className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Eventify
          </span>
        </div>
        
        <nav className="space-y-2">
          {menuItems.map((item) => (
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
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
