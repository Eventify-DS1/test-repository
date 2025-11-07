import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";

const Header = () => {
  const location = useLocation();
  
  const navLinks = [
    { to: "/", label: "Inicio" },
    { to: "/calendario", label: "Calendario" },
    { to: "/eventos", label: "Eventos disponibles" },
  ];
  
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
          <Button variant="ghost" asChild className="hidden sm:flex">
            <Link to="/login">Iniciar sesión</Link>
          </Button>
          <Button className="gradient-primary text-white border-0 hover:opacity-90" asChild>
            <Link to="/register">Registrarse</Link>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
