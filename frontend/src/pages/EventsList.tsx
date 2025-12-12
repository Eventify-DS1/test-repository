import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import EventCard from "@/components/events/EventCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getEventosStatsRequest, getEventosRequest, getCategoriasRequest } from "@/api/auth";
import { getImageUrl } from "@/utils/imageHelpers";

// Interface para los datos del backend
interface Organizador {
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
  fecha_inicio: string;  // Formato: "2024-01-15T14:30:00Z"
  fecha_fin: string;
  aforo: number;
  ubicacion: string;
  foto: string | null;
  categoria: {
    id: number;
    nombre: string;
  } | null;
  organizador: Organizador;
  numero_inscritos?: number;
}

interface Categoria {
  id: number;
  nombre: string;
}

const EventsList = () => {
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [totalEventos, setTotalEventos] = useState(0);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  // Estados para paginación de eventos disponibles (futuros)
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  
  // Estados para historial (eventos pasados)
  const [historialPage, setHistorialPage] = useState(1);
  const [historialHasNextPage, setHistorialHasNextPage] = useState(false);
  const [historialHasPreviousPage, setHistorialHasPreviousPage] = useState(false);
  const [historialTotalPages, setHistorialTotalPages] = useState(1);
  const [historialEventos, setHistorialEventos] = useState<Evento[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [historialSearchTerm, setHistorialSearchTerm] = useState("");

  // Leer categoría de la URL al montar
  useEffect(() => {
    const categoriaParam = searchParams.get('categoria');
    if (categoriaParam) {
      setCategoryFilter(categoriaParam);
    }
  }, [searchParams]);

  // Cargar estadísticas de eventos y categorías al montar el componente
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Cargar estadísticas de eventos
        const statsResponse = await getEventosStatsRequest();
        if (statsResponse.data) {
          setTotalEventos(statsResponse.data.total_eventos ?? 0);
        }

        // Cargar todas las categorías disponibles
        const categoriasResponse = await getCategoriasRequest();
        const categoriasData = categoriasResponse.data.results || categoriasResponse.data;
        setCategorias(Array.isArray(categoriasData) ? categoriasData : []);
      } catch (error) {
        console.error('Error al cargar datos iniciales:', error);
      }
    };

    fetchInitialData();
  }, []);

  // Resetear a página 1 cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter]);

  // Resetear página del historial cuando cambia el término de búsqueda
  useEffect(() => {
    setHistorialPage(1);
  }, [historialSearchTerm]);

  // Cargar eventos futuros del backend
  useEffect(() => {
    const fetchEventos = async () => {
      try {
        setLoading(true);
        const ahora = new Date().toISOString();
        const params: any = {
          page: currentPage,
          page_size: 9,
          fecha_fin__gt: ahora,  // Solo eventos futuros (fecha_fin > ahora)
        };
        
        // Agregar búsqueda si existe
        if (searchTerm) {
          params.search = searchTerm;
        }
        
        // Agregar filtro de categoría si existe (por ID)
        if (categoryFilter !== "all") {
          const categoriaId = parseInt(categoryFilter);
          if (!isNaN(categoriaId)) {
            params.categoria = categoriaId;
          }
        }

        const response = await getEventosRequest(params);
        const eventosData = response.data.results || response.data;
        setEventos(Array.isArray(eventosData) ? eventosData : []);
        
        // Manejar información de paginación
        setHasNextPage(response.data.next !== null && response.data.next !== undefined);
        setHasPreviousPage(response.data.previous !== null && response.data.previous !== undefined);
        
        if (response.data.count) {
          const pageSize = 9;
          setTotalPages(Math.ceil(response.data.count / pageSize));
        }
      } catch (error) {
        console.error('Error al cargar eventos:', error);
        setEventos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEventos();
  }, [searchTerm, categoryFilter, currentPage]);

  // Cargar eventos pasados (historial)
  useEffect(() => {
    const fetchHistorial = async () => {
      try {
        setLoadingHistorial(true);
        const ahora = new Date().toISOString();
        const params: any = {
          page: historialPage,
          page_size: 9,
          fecha_fin__lte: ahora,  // Solo eventos pasados (fecha_fin <= ahora)
          ordering: '-fecha_fin',  // Ordenar por fecha_fin descendente (más recientes primero)
        };

        // Agregar búsqueda si existe
        if (historialSearchTerm) {
          params.search = historialSearchTerm;
        }

        const response = await getEventosRequest(params);
        const eventosData = response.data.results || response.data;
        setHistorialEventos(Array.isArray(eventosData) ? eventosData : []);
        
        // Manejar información de paginación
        setHistorialHasNextPage(response.data.next !== null && response.data.next !== undefined);
        setHistorialHasPreviousPage(response.data.previous !== null && response.data.previous !== undefined);
        
        if (response.data.count) {
          const pageSize = 9;
          setHistorialTotalPages(Math.ceil(response.data.count / pageSize));
        }
      } catch (error) {
        console.error('Error al cargar historial:', error);
        setHistorialEventos([]);
      } finally {
        setLoadingHistorial(false);
      }
    };

    fetchHistorial();
  }, [historialPage, historialSearchTerm]);

  // Formatear fecha: "2024-01-15T14:30:00Z" → "15 de enero, 2024"
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  // Extraer hora: "2024-01-15T14:30:00Z" → "14:30"
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Los eventos ya vienen filtrados del backend, así que usamos directamente eventos
  const filteredEvents = eventos;

  // Funciones para navegar entre páginas de eventos disponibles
  const goToNextPage = () => {
    if (hasNextPage) {
      setCurrentPage(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToPreviousPage = () => {
    if (hasPreviousPage) {
      setCurrentPage(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Funciones para navegar entre páginas del historial
  const goToHistorialNextPage = () => {
    if (historialHasNextPage) {
      setHistorialPage(prev => prev + 1);
      const historialSection = document.getElementById('historial-section');
      if (historialSection) {
        historialSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const goToHistorialPreviousPage = () => {
    if (historialHasPreviousPage) {
      setHistorialPage(prev => prev - 1);
      const historialSection = document.getElementById('historial-section');
      if (historialSection) {
        historialSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  // Usar las categorías cargadas del backend
  const categories = [
    { value: "all", label: "Todas las categorías" },
    ...categorias.map(cat => ({ 
      value: cat.id.toString(), 
      label: cat.nombre 
    }))
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-12 bg-background">
        <div className="container">
          {/* Hero Header */}
          <div className="mb-12 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 mb-4">
              <Search className="h-5 w-5 text-primary" />
              <span className="text-sm font-bold text-primary">Explorar Eventos</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-3">
              Eventos{" "}
              <span className="text-4xl md:text-5xl font-extrabold mb-3">
                disponibles
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Descubre todas las actividades que están sucediendo en tu campus
            </p>
          </div>

          {/* Filters */}
          <div className="mb-8 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar eventos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[250px] h-12">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Stats */}
          <div className="mb-8 flex items-center justify-between">
            <p className="text-muted-foreground">
              Mostrando <span className="font-bold text-foreground">{filteredEvents.length}</span> eventos
              {totalEventos > 0 && (
                <span> de <span className="font-bold text-foreground">{totalEventos}</span> totales</span>
              )}
            </p>
          </div>

          {/* Events Grid */}
          {loading ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">Cargando eventos...</p>
            </div>
          ) : filteredEvents.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredEvents.map((evento, index) => (
                <div
                  key={evento.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <EventCard
                    id={evento.id.toString()}
                    title={evento.titulo}
                    category={evento.categoria?.nombre || "Sin categoría"}
                    date={formatDate(evento.fecha_inicio)}
                    time={formatTime(evento.fecha_inicio)}
                    location={evento.ubicacion}
                    capacity={evento.aforo}
                    registered={evento.numero_inscritos || 0}
                    image={getImageUrl(evento.foto)}
                    skipAuthCheck={true}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No se encontraron eventos</h3>
              <p className="text-muted-foreground mb-6">
                Intenta cambiar los filtros o el término de búsqueda
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setCategoryFilter("all");
                }}
              >
                Limpiar filtros
              </Button>
            </div>
          )}

          {/* Controles de Paginación */}
          {!loading && filteredEvents.length > 0 && (
            <div className="mt-12 flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={goToPreviousPage}
                disabled={!hasPreviousPage}
                className="h-10 w-10"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Página
                </span>
                <span className="text-sm font-semibold">
                  {currentPage} de {totalPages}
                </span>
              </div>
              
              <Button
                variant="outline"
                size="icon"
                onClick={goToNextPage}
                disabled={!hasNextPage}
                className="h-10 w-10"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          )}

          {/* CTA Section */}
          <div className="mt-20 gradient-hero rounded-3xl p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              ¿Quieres crear tu propio evento?
            </h2>
            <p className="text-xl text-foreground/70 mb-6 max-w-2xl mx-auto">
              Debes registrarte para crear y compartir tus eventos con la comunidad universitaria
            </p>
          </div>

          {/* Sección Historial - Eventos Pasados */}
          <div id="historial-section" className="mt-20">
            <div className="mb-8 text-center">
              <h2 className="text-3xl md:text-4xl font-extrabold mb-3">
                Historial de Eventos
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Revisa los eventos que ya han finalizado
              </p>
            </div>

            {/* Buscador del Historial */}
            <div className="mb-8">
              <div className="relative max-w-md mx-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar en historial..."
                  value={historialSearchTerm}
                  onChange={(e) => setHistorialSearchTerm(e.target.value)}
                  className="pl-10 h-12 text-base"
                />
              </div>
            </div>

            {loadingHistorial ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground">Cargando historial...</p>
              </div>
            ) : historialEventos.length > 0 ? (
              <>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
                  {historialEventos.map((evento, index) => (
                    <div
                      key={evento.id}
                      className="animate-fade-in"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <EventCard
                        id={evento.id.toString()}
                        title={evento.titulo}
                        category={evento.categoria?.nombre || "Sin categoría"}
                        date={formatDate(evento.fecha_inicio)}
                        time={formatTime(evento.fecha_inicio)}
                        location={evento.ubicacion}
                        capacity={evento.aforo}
                        registered={evento.numero_inscritos || 0}
                        image={getImageUrl(evento.foto)}
                        skipAuthCheck={true}
                      />
                    </div>
                  ))}
                </div>

                {/* Controles de Paginación del Historial */}
                <div className="mt-12 flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={goToHistorialPreviousPage}
                    disabled={!historialHasPreviousPage}
                    className="h-10 w-10"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Página
                    </span>
                    <span className="text-sm font-semibold">
                      {historialPage} de {historialTotalPages}
                    </span>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={goToHistorialNextPage}
                    disabled={!historialHasNextPage}
                    className="h-10 w-10"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  {historialSearchTerm ? "No se encontraron eventos" : "No hay eventos en el historial"}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {historialSearchTerm 
                    ? "Intenta cambiar el término de búsqueda"
                    : "Aún no hay eventos pasados registrados"}
                </p>
                {historialSearchTerm && (
                  <Button
                    variant="outline"
                    onClick={() => setHistorialSearchTerm("")}
                  >
                    Limpiar búsqueda
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default EventsList;
