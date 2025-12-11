import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Calendar, GraduationCap, Building2, User, Loader2, Users, History, Mail } from "lucide-react";
import { getPublicProfileRequest } from "@/api/users";
import { 
  getUserFutureCreatedEventsRequest, 
  getSharedSubscribedEventsRequest, 
  getSharedAttendedEventsRequest 
} from "@/api/events";
import { getImageUrl } from "@/utils/imageHelpers";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Sidebar from "@/components/layout/Sidebar";
import { useLocation } from "react-router-dom";
import EventCard from "@/components/events/EventCard";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface PerfilPublico {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  nombre_completo: string;
  carrera: string | null;
  facultad: string | null;
  foto: string | null;
  rol_data: {
    id: number;
    nombre: string;
  };
  date_joined: string;
  email: string;
}

interface EventoBackend {
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
  organizador?: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    nombre_completo: string;
  };
  numero_inscritos?: number;
  is_favorito?: boolean;
}

const PublicProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user: currentUser } = useCurrentUser();
  const [perfil, setPerfil] = useState<PerfilPublico | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para eventos
  const [eventosFuturosCreados, setEventosFuturosCreados] = useState<EventoBackend[]>([]);
  const [eventosCompartidosInscritos, setEventosCompartidosInscritos] = useState<EventoBackend[]>([]);
  const [eventosCompartidosAsistidos, setEventosCompartidosAsistidos] = useState<EventoBackend[]>([]);
  const [loadingEventosFuturos, setLoadingEventosFuturos] = useState(true);
  const [loadingEventosCompartidos, setLoadingEventosCompartidos] = useState(true);
  const [loadingEventosAsistidos, setLoadingEventosAsistidos] = useState(true);

  // Detectar si viene del dashboard
  const isFromDashboard = location.pathname.startsWith('/dashboard');

  useEffect(() => {
    const fetchPerfil = async () => {
      if (!id) {
        setError("ID de usuario no válido");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await getPublicProfileRequest(parseInt(id));
        setPerfil(response.data);
      } catch (error: any) {
        console.error('Error al cargar perfil:', error);
        setError(
          error.response?.data?.detail || 
          'Error al cargar el perfil del usuario. Por favor, intenta de nuevo.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPerfil();
  }, [id]);

  // Cargar eventos futuros creados por el usuario
  useEffect(() => {
    const fetchEventosFuturos = async () => {
      if (!id) return;

      try {
        setLoadingEventosFuturos(true);
        const response = await getUserFutureCreatedEventsRequest(parseInt(id));
        const eventos = Array.isArray(response.data) ? response.data : 
                       (response.data.results || []);
        setEventosFuturosCreados(eventos);
      } catch (error: any) {
        console.error('Error al cargar eventos futuros:', error);
        setEventosFuturosCreados([]);
      } finally {
        setLoadingEventosFuturos(false);
      }
    };

    fetchEventosFuturos();
  }, [id]);

  // Cargar eventos compartidos inscritos (solo si hay usuario autenticado)
  useEffect(() => {
    const fetchEventosCompartidos = async () => {
      if (!id || !currentUser) {
        setLoadingEventosCompartidos(false);
        return;
      }

      try {
        setLoadingEventosCompartidos(true);
        const response = await getSharedSubscribedEventsRequest(parseInt(id));
        const eventos = Array.isArray(response.data) ? response.data : 
                       (response.data.results || []);
        setEventosCompartidosInscritos(eventos);
      } catch (error: any) {
        console.error('Error al cargar eventos compartidos:', error);
        setEventosCompartidosInscritos([]);
      } finally {
        setLoadingEventosCompartidos(false);
      }
    };

    fetchEventosCompartidos();
  }, [id, currentUser]);

  // Cargar eventos compartidos asistidos (solo si hay usuario autenticado)
  useEffect(() => {
    const fetchEventosAsistidos = async () => {
      if (!id || !currentUser) {
        setLoadingEventosAsistidos(false);
        return;
      }

      try {
        setLoadingEventosAsistidos(true);
        const response = await getSharedAttendedEventsRequest(parseInt(id));
        const eventos = Array.isArray(response.data) ? response.data : 
                       (response.data.results || []);
        setEventosCompartidosAsistidos(eventos);
      } catch (error: any) {
        console.error('Error al cargar eventos asistidos:', error);
        setEventosCompartidosAsistidos([]);
      } finally {
        setLoadingEventosAsistidos(false);
      }
    };

    fetchEventosAsistidos();
  }, [id, currentUser]);

  const getInitials = () => {
    if (perfil) {
      const first = perfil.first_name?.charAt(0) || '';
      const last = perfil.last_name?.charAt(0) || '';
      return (first + last).toUpperCase() || perfil.username.charAt(0).toUpperCase();
    }
    return 'U';
  };

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

  const Content = () => {
    if (loading) {
      return (
        <div className="container py-12 flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Cargando perfil...</p>
          </div>
        </div>
      );
    }

    if (error || !perfil) {
      return (
        <div className="container py-12 flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-xl font-semibold mb-4">{error || "Usuario no encontrado"}</p>
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="container py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>

        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-start gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={perfil.foto ? getImageUrl(perfil.foto) : undefined} alt={perfil.nombre_completo} />
                <AvatarFallback className="text-2xl gradient-primary text-white">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CardTitle className="text-3xl mb-2">{perfil.nombre_completo}</CardTitle>
                <CardDescription className="text-base">@{perfil.username}</CardDescription>
                {perfil.rol_data && (
                  <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                    <span className="h-2 w-2 rounded-full bg-primary"></span>
                    {perfil.rol_data.nombre}
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {(perfil.carrera || perfil.facultad) && (
              <div className="grid md:grid-cols-2 gap-4">
                {perfil.carrera && (
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                    <GraduationCap className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Carrera</p>
                      <p className="text-base font-semibold">{perfil.carrera}</p>
                    </div>
                  </div>
                )}
                {perfil.facultad && (
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                    <Building2 className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Facultad</p>
                      <p className="text-base font-semibold">{perfil.facultad}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
            {perfil.email && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                <Mail className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Correo</p>
                  <p className="text-base font-semibold">{perfil.email}</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
              <Calendar className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Miembro desde</p>
                <p className="text-base font-semibold">{formatDate(perfil.date_joined)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sección: Eventos Futuros Creados */}
        <Card className="mt-6 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Eventos Futuros Creados
            </CardTitle>
            <CardDescription>
              Eventos que {perfil.nombre_completo} ha creado y que aún no han finalizado
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingEventosFuturos ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Cargando eventos...</span>
              </div>
            ) : eventosFuturosCreados.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No hay eventos futuros creados</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {eventosFuturosCreados.map((evento) => (
                  <EventCard
                    key={evento.id}
                    id={evento.id.toString()}
                    title={evento.titulo}
                    category={evento.categoria?.nombre || "Sin categoría"}
                    date={formatDate(evento.fecha_inicio)}
                    time={formatTime(evento.fecha_inicio)}
                    location={evento.ubicacion}
                    capacity={evento.aforo}
                    registered={evento.numero_inscritos || 0}
                    image={getImageUrl(evento.foto)}
                    isFavorito={evento.is_favorito === true}
                    organizadorId={evento.organizador?.id}
                    descripcion={evento.descripcion}
                    categoriaId={evento.categoria?.id}
                    fechaInicio={evento.fecha_inicio}
                    fechaFin={evento.fecha_fin}
                    skipAuthCheck={!isFromDashboard}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sección: Eventos Compartidos Inscritos (solo si hay usuario autenticado) */}
        {currentUser && (
          <Card className="mt-6 shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Eventos Compartidos
              </CardTitle>
              <CardDescription>
                Eventos futuros donde ambos están inscritos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingEventosCompartidos ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground">Cargando eventos...</span>
                </div>
              ) : eventosCompartidosInscritos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Users className="h-16 w-16 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No hay eventos compartidos</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {eventosCompartidosInscritos.map((evento) => (
                    <EventCard
                      key={evento.id}
                      id={evento.id.toString()}
                      title={evento.titulo}
                      category={evento.categoria?.nombre || "Sin categoría"}
                      date={formatDate(evento.fecha_inicio)}
                      time={formatTime(evento.fecha_inicio)}
                      location={evento.ubicacion}
                      capacity={evento.aforo}
                      registered={evento.numero_inscritos || 0}
                      image={getImageUrl(evento.foto)}
                      isFavorito={evento.is_favorito === true}
                      organizadorId={evento.organizador?.id}
                      descripcion={evento.descripcion}
                      categoriaId={evento.categoria?.id}
                      fechaInicio={evento.fecha_inicio}
                      fechaFin={evento.fecha_fin}
                      skipAuthCheck={false}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Sección: Eventos Compartidos Asistidos (solo si hay usuario autenticado) */}
        {currentUser && (
          <Card className="mt-6 shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                Eventos Pasados Compartidos
              </CardTitle>
              <CardDescription>
                Eventos pasados donde ambos asistieron
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingEventosAsistidos ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground">Cargando eventos...</span>
                </div>
              ) : eventosCompartidosAsistidos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <History className="h-16 w-16 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No hay eventos pasados compartidos</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {eventosCompartidosAsistidos.map((evento) => (
                    <EventCard
                      key={evento.id}
                      id={evento.id.toString()}
                      title={evento.titulo}
                      category={evento.categoria?.nombre || "Sin categoría"}
                      date={formatDate(evento.fecha_inicio)}
                      time={formatTime(evento.fecha_inicio)}
                      location={evento.ubicacion}
                      capacity={evento.aforo}
                      registered={evento.numero_inscritos || 0}
                      image={getImageUrl(evento.foto)}
                      isFavorito={evento.is_favorito === true}
                      organizadorId={evento.organizador?.id}
                      descripcion={evento.descripcion}
                      categoriaId={evento.categoria?.id}
                      fechaInicio={evento.fecha_inicio}
                      fechaFin={evento.fecha_fin}
                      skipAuthCheck={false}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  // Layout condicional: Si viene del dashboard, usa Sidebar; si no, usa Header+Footer
  if (isFromDashboard) {
    return (
      <div className="flex min-h-screen w-full">
        <Sidebar />
        <main className="flex-1">
          <Content />
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <Content />
      </main>
      <Footer />
    </div>
  );
};

export default PublicProfile;

