import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { Calendar, Search } from "lucide-react";

const Header = () => {
  const location = useLocation();
  
  const navLinks = [
    { to: "/", label: "Inicio" },
    { to: "/calendario", label: "Calendario" },
    { to: "/eventos", label: "Eventos disponibles" },
  ];
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
            <Calendar className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Eventify
          </span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location.pathname === link.to
                  ? "text-primary"
                  : "text-foreground/70"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        
        <div className="flex items-center gap-3">
          <Button variant="ghost" asChild>
            <Link to="/dashboard">Iniciar sesión</Link>
          </Button>
          <Button className="gradient-primary text-white border-0 hover:opacity-90" asChild>
            <Link to="/dashboard">Registrarse</Link>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
