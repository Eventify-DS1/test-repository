import { useParams, Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, ArrowLeft } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Sidebar from "@/components/layout/Sidebar";
import eventPlaceholder from "@/assets/event-placeholder.jpg";
import { getEventoByIdRequest, verifyTokenRequest } from "@/api/auth";
import { getImageUrl } from "@/utils/imageHelpers";
import { getCurrentUserRequest } from "@/api/users";
import { deleteEventRequest } from "@/api/events";


// Interface para los datos del backend
interface Organizador {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  nombre_completo: string;
}

interface UsuarioInscrito {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  nombre_completo: string;
}

interface Evento {
  id: number;
  titulo: string;
  descripcion: string;
  fecha_inicio: string;
  fecha_fin: string;
  aforo: number;
  ubicacion: string;
  foto: string | null;
  categoria: {
    id: number;
    nombre: string;
  } | null;
  organizador: Organizador;
  numero_inscritos: number;
  inscritos: UsuarioInscrito[];
}

const EventDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const [evento, setEvento] = useState<Evento | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null); 

  // Detectar si viene del dashboard o es vista pública
  const isFromDashboard = location.pathname.startsWith('/dashboard');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await verifyTokenRequest();
        setIsAuthenticated(true);
      } catch {
        setIsAuthenticated(false);
      }
    };
    
    checkAuth();
  }, []);

  useEffect(() => {
    const fetchEvento = async () => {
      if (!id) {
        setError("ID de evento no válido");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await getEventoByIdRequest(id);
        setEvento(response.data);
      } catch (error: unknown) {
        console.error('Error al cargar evento:', error);
        setError("No se pudo cargar el evento");
      } finally {
        setLoading(false);
      }
    };

    fetchEvento();
  }, [id]);

  useEffect(() =>{
    const fetchUser = async () => {
      try {
        const res = await getCurrentUserRequest();
        setCurrentUser(res.data);
      } catch (e) {
        console.log("No hay usuario autenticado");
        setCurrentUser(null);
      }
    };
    fetchUser();
  }, []);

  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const backRoute = isFromDashboard ? "/dashboard/search" : "/eventos";

  const EventContent = () => {
    if (loading) {
      return (
        <div className="container py-12 flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Cargando evento...</p>
        </div>
      );
    }

    if (error || !evento) {
      return (
        <div className="container py-12 flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-xl font-semibold mb-4">{error || "Evento no encontrado"}</p>
            <Button variant="outline" asChild>
              <Link to={backRoute}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a eventos
              </Link>
            </Button>
          </div>
        </div>
      );
    }

    const registered = evento.numero_inscritos || 0;
    const spotsLeft = evento.aforo - registered;

    const isOwner = currentUser?.id === evento?.organizador?.id;

    const handleDelete = async (id: number) => {
      if (!confirm("¿Seguro que quieres eliminar este evento?")) return;
      try {
        await deleteEventRequest(id);
        alert("Evento eliminado");
        window.location.href = "/dashboard/search";
      } catch (err) {
        console.error(err);
        alert("No se pudo eliminar el evento");
      }
    };



    return (
      <div className={isFromDashboard ? "p-8" : "container py-12"}>
        <Button variant="ghost" asChild className="mb-6">
          <Link to={backRoute}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a eventos
          </Link>
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="relative h-96 rounded-2xl overflow-hidden">
              <img
                src={getImageUrl(evento.foto) || eventPlaceholder}
                alt={evento.titulo}
                className="w-full h-full object-cover"
              />
            </div>

            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-4xl font-bold mb-3">{evento.titulo}</h1>
                  <Badge className="bg-primary/20 text-primary text-sm">
                    {evento.categoria?.nombre || "Sin categoría"}
                  </Badge>
                </div>
              </div>

              <p className="text-lg text-muted-foreground leading-relaxed">
                {evento.descripcion}
              </p>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-card border rounded-2xl p-6 shadow-card sticky top-24 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha de inicio</p>
                    <p className="font-medium">{formatDate(evento.fecha_inicio)}</p>
                    <p className="text-xs text-muted-foreground">{formatTime(evento.fecha_inicio)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-secondary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha de finalización</p>
                    <p className="font-medium">{formatDate(evento.fecha_fin)}</p>
                    <p className="text-xs text-muted-foreground">{formatTime(evento.fecha_fin)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-accent" />
                  <div>
                    <p className="text-sm text-muted-foreground">Ubicación</p>
                    <p className="font-medium">{evento.ubicacion}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Asistentes confirmados</p>
                    <p className="font-medium">
                      {registered} / {evento.aforo} personas
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="mb-3">
                  {spotsLeft > 0 ? (
                    <p className="text-sm text-primary font-medium">
                      ✓ {spotsLeft} cupos disponibles
                    </p>
                  ) : (
                    <p className="text-sm text-destructive font-medium">
                      ✗ Evento lleno
                    </p>
                  )}
                </div>

                {isAuthenticated ? (
                  <Button
                    disabled={spotsLeft <= 0}
                    className="w-full gradient-primary text-white border-0"
                  >
                    {spotsLeft > 0 ? "Inscribirse al evento" : "Evento lleno"}
                  </Button>
                ) : (
                  <>
                    <Button
                      disabled
                      className="w-full gradient-primary text-white border-0"
                    >
                      Registrarse para asistir
                    </Button>
                    <p className="text-xs text-center text-muted-foreground mt-2">
                      Solo disponible para usuarios registrados
                    </p>
                  </>
                )}
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Organizado por:</p>
                <p className="font-semibold">
                  {evento.organizador?.nombre_completo || evento.organizador?.username || 'Desconocido'}
                </p>
              </div>
              {isOwner && (
                <div className="space-y-3 mt-6">
                  <Button className="w-full bg-blue-600 text-white" asChild>
                    <Link to={`/dashboard/eventos/editar/${evento.id}`}>Editar evento</Link>
                    </Button>
                    <Button
                    className="w-full bg-red-600 text-white"
                    onClick={() => handleDelete(evento.id)}
                    >
                      Borrar evento
                      </Button>
                      </div>
                    )}


              {evento.inscritos && evento.inscritos.length > 0 ? (
                <div className="pt-4 border-t">
                  <p className="text-sm font-semibold mb-3">
                    Asistentes inscritos ({evento.inscritos.length})
                  </p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {evento.inscritos.map((inscrito) => (
                      <div
                        key={inscrito.id}
                        className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-base"
                      >
                        <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {inscrito.nombre_completo?.charAt(0).toUpperCase() || inscrito.username?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {inscrito.nombre_completo || inscrito.username}
                          </p>
                          {inscrito.nombre_completo && (
                            <p className="text-xs text-muted-foreground truncate">
                              @{inscrito.username}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="pt-4 border-t">
                  <p className="text-sm font-semibold mb-2">Asistentes inscritos</p>
                  <p className="text-sm text-muted-foreground">
                    Aún no hay asistentes inscritos en este evento.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Layout condicional: Si viene del dashboard, usa Sidebar; si no, usa Header+Footer
  if (isFromDashboard) {
    return (
      <div className="flex min-h-screen w-full">
        <Sidebar />
        <main className="flex-1">
          <EventContent />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <EventContent />
      <Footer />
    </div>
  );
};

export default EventDetail;