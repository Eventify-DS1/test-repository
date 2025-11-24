import Sidebar from "@/components/layout/Sidebar";
import { Input } from "@/components/ui/input";
import { Search, Calendar, Clock, TrendingUp, Sparkles, Zap, ArrowRight } from "lucide-react";
import EventCard from "@/components/events/EventCard";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getImageUrl } from "@/utils/imageHelpers";
import { 
  getPopularEventsRequest,
  getUpcomingSubscribedEventsRequest,
  getAttendedEventsRequest
} from "@/api/events";

// Interface para eventos del backend
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
  numero_inscritos: number;
}

// Interface para eventos mapeados para EventCard
interface EventoMapeado {
  id: string;
  title: string;
  category: string;
  date: string;
  time: string;
  location: string;
  capacity: number;
  registered: number;
  image?: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [popularEvents, setPopularEvents] = useState<EventoMapeado[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<EventoMapeado[]>([]);
  const [attendedEvents, setAttendedEvents] = useState<EventoMapeado[]>([]);
  const [loadingPopular, setLoadingPopular] = useState(true);
  const [loadingUpcoming, setLoadingUpcoming] = useState(true);
  const [loadingAttended, setLoadingAttended] = useState(true);

  // Funciones helper para formatear datos del backend
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

  // Función para mapear eventos del backend al formato de EventCard
  const mapEventToCard = (evento: EventoBackend): EventoMapeado => ({
    id: evento.id.toString(),
    title: evento.titulo,
    category: evento.categoria?.nombre || "Sin categoría",
    date: formatDate(evento.fecha_inicio),
    time: formatTime(evento.fecha_inicio),
    location: evento.ubicacion,
    capacity: evento.aforo,
    registered: evento.numero_inscritos || 0,
    image: getImageUrl(evento.foto)
  });

  // Cargar eventos populares (los 3 con más inscritos)
  useEffect(() => {
    const fetchPopularEvents = async () => {
      try {
        setLoadingPopular(true);
        const response = await getPopularEventsRequest();
        const eventosData = response.data.results || response.data;
        const eventos = Array.isArray(eventosData) ? eventosData : [];
        
        const eventosMapeados = eventos.map(mapEventToCard);
        setPopularEvents(eventosMapeados);
      } catch (error) {
        console.error('Error al cargar eventos populares:', error);
        setPopularEvents([]);
      } finally {
        setLoadingPopular(false);
      }
    };

    fetchPopularEvents();
  }, []);

  // Cargar eventos próximos inscritos
  useEffect(() => {
    const fetchUpcomingEvents = async () => {
      try {
        setLoadingUpcoming(true);
        const response = await getUpcomingSubscribedEventsRequest();
        const eventos = Array.isArray(response.data) ? response.data : [];
        
        const eventosMapeados = eventos.map(mapEventToCard);
        setUpcomingEvents(eventosMapeados);
      } catch (error) {
        console.error('Error al cargar eventos próximos inscritos:', error);
        setUpcomingEvents([]);
      } finally {
        setLoadingUpcoming(false);
      }
    };

    fetchUpcomingEvents();
  }, []);

  // Cargar eventos asistidos
  useEffect(() => {
    const fetchAttendedEvents = async () => {
      try {
        setLoadingAttended(true);
        const response = await getAttendedEventsRequest();
        const eventos = Array.isArray(response.data) ? response.data : [];
        
        const eventosMapeados = eventos.map(mapEventToCard);
        setAttendedEvents(eventosMapeados);
      } catch (error) {
        console.error('Error al cargar eventos asistidos:', error);
        setAttendedEvents([]);
      } finally {
        setLoadingAttended(false);
      }
    };

    fetchAttendedEvents();
  }, []);

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      
      <main className="flex-1 p-8 bg-gradient-to-br from-background via-primary/5 to-secondary/5">
        {/* Welcome Section */}
        <div className="mb-8 relative">
          <div className="absolute -top-4 -left-4 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute top-0 right-0 w-40 h-40 bg-secondary/10 rounded-full blur-3xl" />
          
          <div className="relative bg-white rounded-3xl p-8 shadow-soft border-2 border-primary/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-12 w-12 rounded-2xl gradient-primary flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">
                  ¡Bienvenido de nuevo!
                </h1>
                <p className="text-muted-foreground font-medium">Aquí están tus eventos</p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-6 mt-6 pt-6 border-t border-primary/10">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">{upcomingEvents.length}</div>
                  <div className="text-xs text-muted-foreground font-medium">Próximos eventos</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl gradient-secondary flex items-center justify-center">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-secondary">{attendedEvents.length}</div>
                  <div className="text-xs text-muted-foreground font-medium">Asistidos</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl gradient-accent flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-accent">{upcomingEvents.length + attendedEvents.length}</div>
                  <div className="text-xs text-muted-foreground font-medium">Total participación</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-8 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary z-10" />
          <Input
            placeholder="Buscar eventos por nombre..."
            className="pl-12 h-14 rounded-2xl border-2 border-primary/20 focus:border-primary shadow-card bg-white text-base"
            onFocus={() => navigate('/dashboard/search')}
          />
        </div>

        {/* Los más populares - Nueva sección arriba */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl gradient-accent flex items-center justify-center">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 mb-2">
                  <Zap className="h-4 w-4 text-accent" />
                  <span className="text-xs font-bold text-accent">Eventos Destacados</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold">Los más populares</h2>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard/search')}
              className="border-2 border-primary text-primary hover:bg-primary hover:text-white transition-bounce"
            >
              Ver todos
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          
          {loadingPopular ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Cargando eventos populares...</p>
            </div>
          ) : popularEvents.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {popularEvents.map((event) => (
                <div key={event.id} className="hover-lift">
                  <EventCard
                    id={event.id}
                    title={event.title}
                    category={event.category}
                    date={event.date}
                    time={event.time}
                    location={event.location}
                    capacity={event.capacity}
                    registered={event.registered}
                    image={event.image}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No hay eventos populares disponibles</p>
            </div>
          )}
        </section>

        {/* Eventos Próximos Inscritos */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold">Eventos Próximos Inscritos</h2>
            </div>
          </div>
          
          {loadingUpcoming ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Cargando eventos...</p>
            </div>
          ) : upcomingEvents.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="hover-lift">
                  <EventCard
                    id={event.id}
                    title={event.title}
                    category={event.category}
                    date={event.date}
                    time={event.time}
                    location={event.location}
                    capacity={event.capacity}
                    registered={event.registered}
                    image={event.image}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No tienes eventos próximos inscritos</p>
            </div>
          )}
        </section>

        {/* Eventos Asistidos */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl gradient-secondary flex items-center justify-center">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold">Eventos Asistidos</h2>
            </div>
            <Button
              onClick={() => navigate('/dashboard/rate')}
              className="gradient-accent text-white border-0"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Calificar eventos
            </Button>
          </div>
          
          {loadingAttended ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Cargando eventos...</p>
            </div>
          ) : attendedEvents.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {attendedEvents.map((event) => (
                <div key={event.id} className="hover-lift">
                  <EventCard
                    id={event.id}
                    title={event.title}
                    category={event.category}
                    date={event.date}
                    time={event.time}
                    location={event.location}
                    capacity={event.capacity}
                    registered={event.registered}
                    image={event.image}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Aún no has asistido a ningún evento. ¡Inscríbete y confirma tu asistencia!
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
