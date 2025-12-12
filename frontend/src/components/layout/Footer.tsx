import { Link } from "react-router-dom";
import { 
  Calendar, Mail, MapPin, Phone, 
  Facebook, Twitter, Instagram, Linkedin, Youtube 
} from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <>
      {/* Footer Minimalista */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center gap-6">
            
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Eventify
              </span>
            </div>

            {/* Contacto */}
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-1">Contacto</p>
              <a
                href="mailto:eventifyuv@gmail.com"
                className="text-purple-400 hover:text-purple-300 transition-colors font-medium"
              >
                eventifyuv@gmail.com
              </a>
            </div>

            {/* Divider */}
            <div className="w-full max-w-xs h-px bg-gray-800" />

            {/* Copyright */}
            <p className="text-gray-500 text-sm">
              © {currentYear} Eventify. Todos los derechos reservados.
            </p>

          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
