import Sidebar from "@/components/layout/Sidebar";
import { Input } from "@/components/ui/input";
import { Search, Calendar, Clock, TrendingUp, Sparkles } from "lucide-react";
import EventCard from "@/components/events/EventCard";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { getEventosRequest } from "@/api/auth";

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
  const [upcomingEvents, setUpcomingEvents] = useState<EventoMapeado[]>([]);
  const [allEvents, setAllEvents] = useState<EventoMapeado[]>([]);
  const [loading, setLoading] = useState(true);

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

  const getImageUrl = (foto: string | null) => {
    if (!foto) return undefined;
    if (foto.startsWith('http')) return foto;
    return `http://localhost:8000${foto}`;
  };

  // Cargar eventos del backend
  useEffect(() => {
    const fetchEventos = async () => {
      try {
        setLoading(true);
        const response = await getEventosRequest();
        const eventosData = response.data.results || response.data;
        const eventos = Array.isArray(eventosData) ? eventosData : [];
        
        // Mapear eventos al formato que espera EventCard
        const eventosMapeados: EventoMapeado[] = eventos.map((evento: EventoBackend) => ({
          id: evento.id.toString(),
          title: evento.titulo,
          category: evento.categoria?.nombre || "Sin categoría",
          date: formatDate(evento.fecha_inicio),
          time: formatTime(evento.fecha_inicio),
          location: evento.ubicacion,
          capacity: evento.aforo,
          registered: evento.numero_inscritos || 0,
          image: getImageUrl(evento.foto)
        }));

        // Filtrar eventos próximos (fecha_inicio >= hoy)
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        
        const eventosProximos = eventos
          .filter((evento: EventoBackend) => {
            const fechaInicio = new Date(evento.fecha_inicio);
            fechaInicio.setHours(0, 0, 0, 0);
            return fechaInicio >= hoy;
          })
          .map((evento: EventoBackend) => ({
            id: evento.id.toString(),
            title: evento.titulo,
            category: evento.categoria?.nombre || "Sin categoría",
            date: formatDate(evento.fecha_inicio),
            time: formatTime(evento.fecha_inicio),
            location: evento.ubicacion,
            capacity: evento.aforo,
            registered: evento.numero_inscritos || 0,
            image: getImageUrl(evento.foto)
          }));

        setUpcomingEvents(eventosProximos);
        setAllEvents(eventosMapeados);
      } catch (error) {
        console.error('Error al cargar eventos:', error);
        setUpcomingEvents([]);
        setAllEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEventos();
  }, []);

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      
      <main className="flex-1 p-8 bg-gradient-to-br from-background via-primary/5 to-secondary/5">
        {/* Welcome Section - Super Atractivo */}
        <div className="mb-8 relative">
          <div className="absolute -top-4 -left-4 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute top-0 right-0 w-40 h-40 bg-secondary/10 rounded-full blur-3xl" />
          
          <div className="relative bg-white rounded-3xl p-8 shadow-soft border-2 border-primary/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-12 w-12 rounded-2xl gradient-primary flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-primary bg-clip-text text-transparent">
                  ¡Bienvenido de nuevo!
                </h1>
                <p className="text-muted-foreground font-medium">Aquí están tus próximos eventos</p>
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
                  <div className="text-2xl font-bold text-secondary">0</div>
                  <div className="text-xs text-muted-foreground font-medium">Asistidos</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl gradient-accent flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-accent">0</div>
                  <div className="text-xs text-muted-foreground font-medium">Total participación</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar - Mejorado */}
        <div className="mb-8 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary z-10" />
          <Input
            placeholder="Buscar eventos por nombre..."
            className="pl-12 h-14 rounded-2xl border-2 border-primary/20 focus:border-primary shadow-card bg-white text-base"
          />
        </div>

        {/* Upcoming Events - Más Colorido */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold">Eventos Próximos Inscritos</h2>
            </div>
          </div>
          
          {loading ? (
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
              <p className="text-muted-foreground">No hay eventos próximos disponibles</p>
            </div>
          )}
        </section>

        {/* Past Events - Más Llamativo */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl gradient-secondary flex items-center justify-center">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold">Eventos Asistidos</h2>
            </div>
            <Button
              disabled
              className="gradient-accent text-white border-0 opacity-60 cursor-not-allowed"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Calificar eventos
            </Button>
          </div>
          
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Cargando eventos...</p>
            </div>
          ) : allEvents.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allEvents.map((event) => (
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
              <p className="text-muted-foreground">No hay eventos disponibles</p>
            </div>
          )}

          <div className="mt-8 rounded-2xl border border-dashed border-muted-foreground/40 bg-muted/30 p-6 text-center">
            <Sparkles className="mx-auto mb-3 h-6 w-6 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Próximamente</h3>
            <p className="text-sm text-muted-foreground">
              Muy pronto podrás visualizar tus eventos asistidos y dejar calificaciones desde aquí.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
