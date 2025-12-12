import { useState, useEffect, useMemo } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
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

const DashboardCalendar = () => {
  const navigate = useNavigate();
  const [selectedEvent, setSelectedEvent] = useState<EventoBackend | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [eventos, setEventos] = useState<EventoBackend[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para paginación de próximos eventos
  const [proximosEventosPage, setProximosEventosPage] = useState(1);
  const eventosPorPagina = 3; // Mostrar 3 eventos por página

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

  // Cargar eventos del backend (todas las páginas)
  useEffect(() => {
    const fetchEventos = async () => {
      try {
        setLoading(true);
        let allEventos: EventoBackend[] = [];
        let nextUrl: string | null = null;
        let page = 1;

        // Obtener primera página
        const firstResponse = await getEventosRequest();
        const firstPageData = firstResponse.data.results || firstResponse.data;
        if (Array.isArray(firstPageData)) {
          allEventos = [...allEventos, ...firstPageData];
        }
        nextUrl = firstResponse.data.next;

        // Obtener todas las páginas restantes
        while (nextUrl) {
          try {
            page++;
            const response = await getEventosRequest({ page });
            const pageData = response.data.results || response.data;
            if (Array.isArray(pageData)) {
              allEventos = [...allEventos, ...pageData];
            }
            nextUrl = response.data.next;
          } catch (pageError) {
            // Si hay error en una página, continuar con las demás
            break;
          }
        }
        
        setEventos(allEventos);
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

  // Calcular eventos futuros y aplicar paginación
  const eventosFuturos = useMemo(() => {
    const ahora = new Date();
    return eventos
      .filter(evento => {
        if (!evento.fecha_fin) {
          return false;
        }
        const fechaFin = new Date(evento.fecha_fin);
        return fechaFin > ahora;
      })
      .sort((a, b) => {
        const fechaA = new Date(a.fecha_inicio).getTime();
        const fechaB = new Date(b.fecha_inicio).getTime();
        return fechaA - fechaB;
      });
  }, [eventos]);

  // Calcular total de páginas
  const totalPagesProximos = Math.ceil(eventosFuturos.length / eventosPorPagina);

  // Obtener eventos de la página actual
  const eventosFuturosPaginados = useMemo(() => {
    const inicio = (proximosEventosPage - 1) * eventosPorPagina;
    const fin = inicio + eventosPorPagina;
    return eventosFuturos.slice(inicio, fin);
  }, [eventosFuturos, proximosEventosPage, eventosPorPagina]);

  // Funciones para navegar entre páginas
  const goToNextPageProximos = () => {
    if (proximosEventosPage < totalPagesProximos) {
      setProximosEventosPage(prev => prev + 1);
      // Scroll suave hacia la sección de próximos eventos
      const proximosSection = document.getElementById('proximos-eventos-section');
      if (proximosSection) {
        proximosSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const goToPreviousPageProximos = () => {
    if (proximosEventosPage > 1) {
      setProximosEventosPage(prev => prev - 1);
      // Scroll suave hacia la sección de próximos eventos
      const proximosSection = document.getElementById('proximos-eventos-section');
      if (proximosSection) {
        proximosSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      
      <main className="flex-1 p-8 bg-gradient-to-br from-background via-primary/5 to-secondary/5">
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

        <Card className="shadow-soft border-2 mb-8">
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
        <div id="proximos-eventos-section" className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold">Próximos eventos</h2>
            {!loading && eventosFuturos.length > 0 && (
              <p className="text-muted-foreground">
                Mostrando {eventosFuturosPaginados.length} de {eventosFuturos.length} eventos
              </p>
            )}
          </div>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Cargando eventos...</p>
            </div>
          ) : eventosFuturos.length > 0 ? (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {eventosFuturosPaginados.map((evento) => (
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

              {/* Controles de Paginación */}
              {eventosFuturos.length > eventosPorPagina && (
                <div className="mt-12 flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={goToPreviousPageProximos}
                    disabled={proximosEventosPage === 1}
                    className="h-10 w-10"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Página
                    </span>
                    <span className="text-sm font-semibold">
                      {proximosEventosPage} de {totalPagesProximos}
                    </span>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={goToNextPageProximos}
                    disabled={proximosEventosPage === totalPagesProximos}
                    className="h-10 w-10"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No hay eventos próximos disponibles</p>
            </div>
          )}
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
            {/* Agregar botón "Ver detalles" aquí */}
            <div className="pt-4 border-t">
              <Button 
                onClick={() => {
                  if (selectedEvent) {
                    navigate(`/dashboard/event/${selectedEvent.id}`, { state: { fromCalendar: true } });
                    setSelectedEvent(null);
                  }
                }}
                className="w-full gradient-primary text-white border-0"
              >
                Ver detalles
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardCalendar;

