import { Link } from "react-router-dom";
import { Calendar, Mail, MapPin, Phone, Facebook, Twitter, Instagram, Linkedin, Youtube } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* About Section */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Eventify
              </span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed">
              La plataforma #1 para descubrir, crear y participar en eventos universitarios. 
              Conecta con tu comunidad y vive experiencias inolvidables.
            </p>
            <div className="flex gap-3 pt-2">
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-primary flex items-center justify-center transition-all hover:scale-110"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-primary flex items-center justify-center transition-all hover:scale-110"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-primary flex items-center justify-center transition-all hover:scale-110"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-primary flex items-center justify-center transition-all hover:scale-110"
              >
                <Linkedin className="h-4 w-4" />
              </a>
              <a 
                href="https://youtube.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-primary flex items-center justify-center transition-all hover:scale-110"
              >
                <Youtube className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-white">Plataforma</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/eventos" className="text-sm text-gray-400 hover:text-primary transition-colors">
                  Explorar Eventos
                </Link>
              </li>
              <li>
                <Link to="/calendario" className="text-sm text-gray-400 hover:text-primary transition-colors">
                  Calendario
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-sm text-gray-400 hover:text-primary transition-colors">
                  Crear Evento
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-sm text-gray-400 hover:text-primary transition-colors">
                  Mis Eventos
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-sm text-gray-400 hover:text-primary transition-colors">
                  Panel de Control
                </Link>
              </li>
            </ul>
          </div>

          {/* Community Links */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-white">Comunidad</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/#" className="text-sm text-gray-400 hover:text-primary transition-colors">
                  Sobre Nosotros
                </Link>
              </li>
              <li>
                <Link to="/#" className="text-sm text-gray-400 hover:text-primary transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/#" className="text-sm text-gray-400 hover:text-primary transition-colors">
                  Guías
                </Link>
              </li>
              <li>
                <Link to="/#" className="text-sm text-gray-400 hover:text-primary transition-colors">
                  Preguntas Frecuentes
                </Link>
              </li>
              <li>
                <Link to="/#" className="text-sm text-gray-400 hover:text-primary transition-colors">
                  Testimonios
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-white">Contacto</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-gray-400">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                <span>Av. Universidad 123, Ciudad Universitaria</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-400">
                <Mail className="h-4 w-4 flex-shrink-0 text-primary" />
                <a href="mailto:contacto@eventify.com" className="hover:text-primary transition-colors">
                  contacto@eventify.com
                </a>
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-400">
                <Phone className="h-4 w-4 flex-shrink-0 text-primary" />
                <a href="tel:+525512345678" className="hover:text-primary transition-colors">
                  +52 (55) 1234-5678
                </a>
              </li>
            </ul>
            <div className="mt-6">
              <h4 className="font-semibold text-sm mb-2 text-white">Legal</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/#" className="text-xs text-gray-400 hover:text-primary transition-colors">
                    Términos y Condiciones
                  </Link>
                </li>
                <li>
                  <Link to="/#" className="text-xs text-gray-400 hover:text-primary transition-colors">
                    Política de Privacidad
                  </Link>
                </li>
                <li>
                  <Link to="/#" className="text-xs text-gray-400 hover:text-primary transition-colors">
                    Política de Cookies
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">
              © {currentYear} Eventify. Todos los derechos reservados.
            </p>
            <p className="text-xs text-gray-500">
              Hecho con ❤️ para la comunidad universitaria
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
