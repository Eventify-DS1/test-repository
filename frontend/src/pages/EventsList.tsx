import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Filter } from "lucide-react";
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
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
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const [count, setCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

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

  // Cargar eventos del backend
  useEffect(() => {
    const fetchEventos = async () => {
      try {
        setLoading(true);
        const params: any = {
          page: page,
          page_size: pageSize,
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
        // DRF devuelve results si hay paginación, o el array directamente
        const eventosData = response.data.results || response.data;
        setEventos(Array.isArray(eventosData) ? eventosData : []);
        
        // Manejar información de paginación
        if (response.data.count !== undefined) {
          setCount(response.data.count);
          const calculatedTotalPages = Math.ceil(response.data.count / pageSize);
          setTotalPages(calculatedTotalPages);
        }
        setHasNext(!!response.data.next);
        setHasPrevious(!!response.data.previous);
      } catch (error) {
        console.error('Error al cargar eventos:', error);
        setEventos([]);
        setCount(0);
        setTotalPages(1);
        setHasNext(false);
        setHasPrevious(false);
      } finally {
        setLoading(false);
      }
    };

    fetchEventos();
  }, [searchTerm, categoryFilter, page, pageSize]);

  // Resetear página cuando cambian los filtros
  useEffect(() => {
    setPage(1);
  }, [searchTerm, categoryFilter]);

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
              Mostrando <span className="font-bold text-foreground">{eventos.length}</span> de{" "}
              <span className="font-bold text-foreground">{count || totalEventos}</span> eventos
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
                  setPage(1);
                }}
              >
                Limpiar filtros
              </Button>
            </div>
          )}

          {/* Paginación */}
          {!loading && filteredEvents.length > 0 && totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => {
                        if (hasPrevious) {
                          setPage(page - 1);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }}
                      className={!hasPrevious ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                    // Mostrar solo algunas páginas alrededor de la actual
                    if (
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      (pageNum >= page - 2 && pageNum <= page + 2)
                    ) {
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            onClick={() => {
                              setPage(pageNum);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            isActive={pageNum === page}
                            className="cursor-pointer"
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    } else if (
                      pageNum === page - 3 ||
                      pageNum === page + 3
                    ) {
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }
                    return null;
                  })}
                  
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => {
                        if (hasNext) {
                          setPage(page + 1);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }}
                      className={!hasNext ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
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
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default EventsList;
