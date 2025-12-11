import { Button } from "@/components/ui/button";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { logoutRequest } from "@/api/auth";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isLoading } = useCurrentUser();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const navLinks = [
    { to: "/", label: "Inicio" },
    { to: "/calendario", label: "Calendario" },
    { to: "/eventos", label: "Eventos disponibles" },
  ];

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logoutRequest();
      // Limpiar el caché del usuario al cerrar sesión
      queryClient.removeQueries({ queryKey: ["currentUser"] });
      queryClient.clear();
      toast.success("Sesión cerrada correctamente");
      navigate("/");
      // Recargar la página para actualizar el estado
      window.location.reload();
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      toast.error("No se pudo cerrar la sesión");
    } finally {
      setIsLoggingOut(false);
    }
  };
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <img src="/branding/logo.png" alt="Eventify" className="h-10 w-auto" />
        </Link>
        
        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 flex-1 justify-center">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`text-sm font-medium transition-colors hover:text-primary whitespace-nowrap ${
                location.pathname === link.to
                  ? "text-primary"
                  : "text-foreground/70"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        
        {/* Auth Buttons */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : user ? (
            <>
              <Button variant="ghost" asChild className="hidden sm:flex">
                <Link to="/dashboard">Ir al Dashboard</Link>
              </Button>
              <Button
                variant="outline"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="border-destructive text-destructive hover:bg-destructive/10"
              >
                {isLoggingOut ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cerrando...
                  </>
                ) : (
                  <>
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar sesión
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild className="hidden sm:flex">
                <Link to="/login">Iniciar sesión</Link>
              </Button>
              <Button className="gradient-primary text-white border-0 hover:opacity-90" asChild>
                <Link to="/register">Registrarse</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
