import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getEventosRequest } from "@/api/auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  organizador: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    nombre_completo: string;
  };
}

const Calendario = () => {
  const [selectedEvent, setSelectedEvent] = useState<EventoBackend | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [eventos, setEventos] = useState<EventoBackend[]>([]);
  const [loading, setLoading] = useState(true);

  // Funciones helper para formatear datos
  const formatDateToCompare = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateDisplay = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
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

  // Paleta de colores para categorías (más colores para mayor flexibilidad)
  const categoryColors = [
    { bg: "bg-blue-500", badge: "bg-blue-500/20 text-blue-700 hover:bg-blue-500/30" },
    { bg: "bg-green-500", badge: "bg-green-500/20 text-green-700 hover:bg-green-500/30" },
    { bg: "bg-purple-500", badge: "bg-purple-500/20 text-purple-700 hover:bg-purple-500/30" },
    { bg: "bg-amber-500", badge: "bg-amber-500/20 text-amber-700 hover:bg-amber-500/30" },
    { bg: "bg-red-500", badge: "bg-red-500/20 text-red-700 hover:bg-red-500/30" },
    { bg: "bg-pink-500", badge: "bg-pink-500/20 text-pink-700 hover:bg-pink-500/30" },
    { bg: "bg-indigo-500", badge: "bg-indigo-500/20 text-indigo-700 hover:bg-indigo-500/30" },
    { bg: "bg-teal-500", badge: "bg-teal-500/20 text-teal-700 hover:bg-teal-500/30" },
    { bg: "bg-orange-500", badge: "bg-orange-500/20 text-orange-700 hover:bg-orange-500/30" },
    { bg: "bg-cyan-500", badge: "bg-cyan-500/20 text-cyan-700 hover:bg-cyan-500/30" },
  ];

  // Función para obtener un color de forma determinística basado en el nombre de la categoría
  const getColorForCategory = (categoryName: string): { bg: string; badge: string } => {
    if (!categoryName) {
      return { bg: "bg-gray-500", badge: "bg-gray-500/20 text-gray-700" };
    }
    
    // Hash simple para mapear categorías a colores de forma consistente
    let hash = 0;
    for (let i = 0; i < categoryName.length; i++) {
      hash = categoryName.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const index = Math.abs(hash) % categoryColors.length;
    return categoryColors[index];
  };

  const getCategoryColor = (category: string | null) => {
    if (!category) return "bg-gray-500";
    return getColorForCategory(category).bg;
  };

  const getCategoryBadgeColor = (category: string | null) => {
    if (!category) return "bg-gray-500/20 text-gray-700";
    return getColorForCategory(category).badge;
  };

  // Obtener categorías únicas de los eventos
  const getUniqueCategories = () => {
    const categoriesMap = new Map<string, { id: number; nombre: string }>();
    eventos.forEach((evento) => {
      if (evento.categoria) {
        categoriesMap.set(evento.categoria.nombre, evento.categoria);
      }
    });
    return Array.from(categoriesMap.values());
  };

  // Verificar si un día es hoy
  const isToday = (day: number) => {
    const today = new Date();
    const { year, month } = getDaysInMonth(currentDate);
    return (
      today.getDate() === day &&
      today.getMonth() === month &&
      today.getFullYear() === year
    );
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  // Cargar eventos del backend
  useEffect(() => {
    const fetchEventos = async () => {
      try {
        setLoading(true);
        const response = await getEventosRequest();
        const eventosData = response.data.results || response.data;
        setEventos(Array.isArray(eventosData) ? eventosData : []);
      } catch (error) {
        console.error('Error al cargar eventos:', error);
        setEventos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEventos();
  }, []);

  const getEventsForDate = (day: number) => {
    const { year, month } = getDaysInMonth(currentDate);
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    
    // Filtrar eventos del backend que coincidan con la fecha
    return eventos.filter((evento) => {
      const eventoFecha = formatDateToCompare(evento.fecha_inicio);
      return eventoFecha === dateStr;
    });
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleDateString("es-ES", { month: "long", year: "numeric" });

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-12 bg-gradient-hero">
        <div className="container">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-soft mb-4">
              <CalendarIcon className="h-5 w-5 text-primary" />
              <span className="text-sm font-bold text-primary">Calendario de Eventos</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-3">
              Planifica tu{" "}
              <span className="text-4xl md:text-5xl font-extrabold mb-3">
                semestre
              </span>
            </h1>
            <p className="text-xl text-foreground/70">
              Visualiza todos los eventos próximos del campus
            </p>
          </div>

          <Card className="shadow-soft border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl capitalize">{monthName}</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={previousMonth}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={nextMonth}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardDescription>
                Vista mensual de eventos universitarios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day) => (
                  <div
                    key={day}
                    className="text-center font-semibold text-sm text-muted-foreground py-2"
                  >
                    {day}
                  </div>
                ))}

                {Array.from({ length: startingDayOfWeek }).map((_, index) => (
                  <div key={`empty-${index}`} className="aspect-square" />
                ))}

                {Array.from({ length: daysInMonth }).map((_, index) => {
                  const day = index + 1;
                  const events = getEventsForDate(day);
                  const hasEvents = events.length > 0;
                  const today = isToday(day);

                  return (
                    <div
                      key={day}
                      className={`aspect-square border-2 rounded-lg p-2 hover:border-primary transition-base flex flex-col ${
                        today
                          ? "bg-primary/10 border-primary ring-2 ring-primary/20"
                          : hasEvents
                          ? "bg-primary/5 cursor-pointer border-border"
                          : "bg-background border-border"
                      }`}
                    >
                      <div
                        className={`text-sm font-medium mb-1 ${
                          today ? "text-primary font-bold" : ""
                        }`}
                      >
                        {day}
                      </div>
                      <div className="flex-1 space-y-1 overflow-hidden">
                        {events.slice(0, 2).map((event) => (
                          <div
                            key={event.id}
                            onClick={() => setSelectedEvent(event)}
                            className={`${getCategoryColor(
                              event.categoria?.nombre || null
                            )} text-white text-xs px-1.5 py-0.5 rounded cursor-pointer hover:opacity-90 transition-base truncate`}
                            title={event.titulo}
                          >
                            {event.titulo}
                          </div>
                        ))}
                        {events.length > 2 && (
                          <div className="text-xs text-muted-foreground font-medium">
                            +{events.length - 2} más
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {getUniqueCategories().length > 0 && (
                <div className="mt-6 flex flex-wrap gap-4 justify-center">
                  {getUniqueCategories().map((categoria) => {
                    const colorInfo = getColorForCategory(categoria.nombre);
                    return (
                      <div key={categoria.id} className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded ${colorInfo.bg}`} />
                        <span className="text-sm">{categoria.nombre}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Próximos eventos */}
          <div className="mt-12">
            <h2 className="text-3xl font-bold mb-6">Próximos eventos</h2>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Cargando eventos...</p>
              </div>
            ) : eventos.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {eventos
                  .filter(evento => new Date(evento.fecha_inicio) >= new Date())
                  .sort((a, b) => new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime())
                  .slice(0, 6)
                  .map((evento) => (
                    <Card
                      key={evento.id}
                      className="hover:shadow-soft transition-base cursor-pointer"
                      onClick={() => setSelectedEvent(evento)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-lg line-clamp-2">{evento.titulo}</CardTitle>
                          <Badge className={getCategoryBadgeColor(evento.categoria?.nombre || null)}>
                            {evento.categoria?.nombre || "Sin categoría"}
                          </Badge>
                        </div>
                        <CardDescription>
                          {formatDateDisplay(evento.fecha_inicio)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>⏰ {formatTime(evento.fecha_inicio)}</p>
                          <p>📍 {evento.ubicacion}</p>
                          <p>
                            👥 {evento.numero_inscritos || 0}/{evento.aforo} inscritos
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No hay eventos disponibles</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Event Detail Modal */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <DialogTitle className="text-2xl">{selectedEvent?.titulo}</DialogTitle>
              <Badge className={getCategoryBadgeColor(selectedEvent?.categoria?.nombre || null)}>
                {selectedEvent?.categoria?.nombre || "Sin categoría"}
              </Badge>
            </div>
            <DialogDescription className="text-base">
              {selectedEvent?.descripcion}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fecha</p>
                <p className="text-base">
                  {selectedEvent && formatDateDisplay(selectedEvent.fecha_inicio)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Hora</p>
                <p className="text-base">{selectedEvent && formatTime(selectedEvent.fecha_inicio)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ubicación</p>
                <p className="text-base">{selectedEvent?.ubicacion}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Aforo</p>
                <p className="text-base">
                  {selectedEvent?.numero_inscritos || 0}/{selectedEvent?.aforo} inscritos
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Organizador</p>
              <p className="text-base">
                {selectedEvent?.organizador?.nombre_completo || selectedEvent?.organizador?.username || 'Desconocido'}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Calendario;
