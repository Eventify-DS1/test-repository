import { useState, useEffect } from "react";
import { Search as SearchIcon, Filter, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
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
import { getEventosStatsRequest, getEventosRequest, getCategoriasRequest, verifyTokenRequest } from "@/api/auth";
import { getUserInscriptionsRequest } from "@/api/events";
import { toast } from "sonner";
import { getImageUrl } from "@/utils/imageHelpers";
import apiClient from "@/api/api";

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
  numero_inscritos?: number;
  is_favorito?: boolean;
}

interface Categoria {
  id: number;
  nombre: string;
}

const Search = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState("");
  const [subscriptionFilter, setSubscriptionFilter] = useState<string>("all"); // all, subscribed, not_subscribed
  const [locationFilter, setLocationFilter] = useState<string>("all"); // all, or specific location
  const [timeFilter, setTimeFilter] = useState<string>("future"); // future, all, past - Por defecto "future"
  const [sortBy, setSortBy] = useState<string>("date"); // date, popular, capacity
  const [totalEventos, setTotalEventos] = useState(0);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [subscribedEventIds, setSubscribedEventIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(true);
  
  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);


  useEffect(() => {
    const checkAuth = async () => {
      try {
        await verifyTokenRequest();
      } catch (error) {
        console.error("No autenticado:", error);
        toast.error("Debes iniciar sesión");
        navigate("/login");
      }
    };
    
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const statsResponse = await getEventosStatsRequest();
        if (statsResponse.data) {
          setTotalEventos(statsResponse.data.total_eventos ?? 0);
        }

        const categoriasResponse = await getCategoriasRequest();
        const categoriasData = categoriasResponse.data.results || categoriasResponse.data;
        setCategorias(Array.isArray(categoriasData) ? categoriasData : []);
      } catch (error) {
        console.error('Error al cargar datos iniciales:', error);
      }
    };

    fetchInitialData();
  }, []);

  // Cargar inscripciones del usuario
  useEffect(() => {
    const fetchUserSubscriptions = async () => {
      try {
        setLoadingSubscriptions(true);
        const response = await getUserInscriptionsRequest();
        const inscripciones = Array.isArray(response.data) ? response.data : 
                             (response.data.results || []);
        
        // Crear un Set con los IDs de eventos en los que está inscrito
        const eventIds = new Set<number>();
        
        inscripciones.forEach((inscripcion: any) => {
          // El evento puede venir como objeto completo o como ID
          let eventoId: number | undefined;
          
          if (inscripcion.evento) {
            if (typeof inscripcion.evento === 'object' && inscripcion.evento.id) {
              // Es un objeto con id
              eventoId = inscripcion.evento.id;
            } else if (typeof inscripcion.evento === 'number') {
              // Es directamente el ID
              eventoId = inscripcion.evento;
            }
          }
          
          if (eventoId !== undefined && !isNaN(eventoId)) {
            eventIds.add(Number(eventoId));
          }
        });
        
        setSubscribedEventIds(eventIds);
      } catch (error) {
        console.error('Error al cargar inscripciones:', error);
        setSubscribedEventIds(new Set());
      } finally {
        setLoadingSubscriptions(false);
      }
    };

    fetchUserSubscriptions();
  }, []);

  // Resetear a página 1 cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, dateFilter, subscriptionFilter, locationFilter, timeFilter, sortBy]);

  useEffect(() => {
    const fetchEventos = async () => {
      try {
        setLoading(true);
        const ahora = new Date().toISOString();
        const params: any = {
          page: currentPage,
          page_size: 9,  // Mostrar 9 eventos por página
        };
        
        if (searchTerm) {
          params.search = searchTerm;
        }
        
        if (categoryFilter !== "all") {
          const categoriaId = parseInt(categoryFilter);
          if (!isNaN(categoriaId)) {
            params.categoria = categoriaId;
          }
        }

        // Filtro de tiempo (futuros, pasados, todos)
        if (timeFilter === "future") {
          params.fecha_fin__gt = ahora;  // Solo eventos futuros
        } else if (timeFilter === "past") {
          params.fecha_fin__lte = ahora;  // Solo eventos pasados
        }
        // Si timeFilter === "all", no agregamos filtro de fecha

        // Filtro de fecha específica (si está seleccionada)
        if (dateFilter) {
          // Convertir fecha del input (YYYY-MM-DD) a formato ISO para comparar
          const fechaInicio = new Date(dateFilter + "T00:00:00");
          const fechaFin = new Date(dateFilter + "T23:59:59");
          params.fecha_inicio__gte = fechaInicio.toISOString();
          params.fecha_inicio__lte = fechaFin.toISOString();
        }

        // Filtro de inscripción (aplicado en el backend)
        if (subscriptionFilter === "subscribed") {
          params.inscrito = "true";  // Solo eventos donde el usuario está inscrito
        } else if (subscriptionFilter === "not_subscribed") {
          params.inscrito = "false";  // Solo eventos donde el usuario NO está inscrito
        }
        // Si subscriptionFilter === "all", no agregamos el parámetro

        // Mover ordenamiento al backend
        if (sortBy === "date") {
          params.ordering = "-fecha_inicio";  // Más reciente primero
        } else if (sortBy === "popular") {
          // Para popular, necesitamos ordenar por número de inscritos
          // Esto puede requerir un endpoint especial o usar un campo calculado
          params.ordering = "-fecha_inicio";  // Por ahora, usar fecha como fallback
        } else if (sortBy === "capacity") {
          params.ordering = "-aforo";  // Mayor capacidad primero
        }

        const response = await getEventosRequest(params);
        const eventosData = response.data.results || response.data;
        setEventos(Array.isArray(eventosData) ? eventosData : []);
        
        // Manejar información de paginación
        setHasNextPage(response.data.next !== null && response.data.next !== undefined);
        setHasPreviousPage(response.data.previous !== null && response.data.previous !== undefined);
        
        if (response.data.count !== undefined) {
          setTotalCount(response.data.count);
          const pageSize = 9;
          setTotalPages(Math.ceil(response.data.count / pageSize));
        }
      } catch (error) {
        console.error('Error al cargar eventos:', error);
        setEventos([]);
        setTotalPages(1);
        setHasNextPage(false);
        setHasPreviousPage(false);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchEventos();
  }, [searchTerm, categoryFilter, dateFilter, timeFilter, subscriptionFilter, currentPage, sortBy]);


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

  const filteredEvents = eventos.filter(evento => {
    // Filtro por ubicación (aplicado en el frontend porque requiere todas las ubicaciones)
    if (locationFilter !== "all" && evento.ubicacion !== locationFilter) {
      return false;
    }

    // El filtro de inscripción ahora se aplica en el backend, así que no necesitamos filtrarlo aquí
    return true;
  });

  // Ordenar eventos según el criterio seleccionado
  // Nota: El ordenamiento básico (fecha, capacidad) ya se hace en el backend
  // Solo aplicamos ordenamiento adicional para "popular" si es necesario
  let sortedEvents = filteredEvents;
  
  if (sortBy === "popular") {
    // Ordenar por número de inscritos (más popular primero)
    sortedEvents = [...filteredEvents].sort((a, b) => {
      const inscritosA = a.numero_inscritos || 0;
      const inscritosB = b.numero_inscritos || 0;
      return inscritosB - inscritosA;
    });
  }

  const categories = [
    { value: "all", label: "Todas las categorías" },
    ...categorias.map(cat => ({ 
      value: cat.id.toString(), 
      label: cat.nombre 
    }))
  ];

  const ubicaciones = Array.from(new Set(eventos.map(e => e.ubicacion))).filter(Boolean);

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      
      <main className="flex-1 p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Buscar Eventos</h1>
            <p className="text-muted-foreground">Encuentra el evento perfecto para ti</p>
          </div>
          <Button
            onClick={() => navigate("/dashboard/create")}
            className="gradient-primary text-white border-0"
          >
            <Plus className="mr-2 h-4 w-4" />
            Crear Evento
          </Button>
        </div>

        <div className="bg-card p-6 rounded-2xl shadow-card mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Filter className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Filtros de búsqueda</h2>
          </div>
          
          <div className="grid md:grid-cols-5 gap-4">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categorias.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input 
              type="date" 
              placeholder="Fecha" 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />

            <Select value={subscriptionFilter} onValueChange={setSubscriptionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Inscripción" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los eventos</SelectItem>
                <SelectItem value="subscribed">Eventos inscritos</SelectItem>
                <SelectItem value="not_subscribed">Eventos no inscritos</SelectItem>
              </SelectContent>
            </Select>

            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Ubicación" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las ubicaciones</SelectItem>
                {ubicaciones.map((ubicacion) => (
                  <SelectItem key={ubicacion} value={ubicacion}>
                    {ubicacion}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro adicional de tiempo */}
          <div className="mt-4">
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-full md:w-[300px]">
                <SelectValue placeholder="Tiempo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="future">Eventos futuros</SelectItem>
                <SelectItem value="all">Todos los eventos</SelectItem>
                <SelectItem value="past">Eventos pasados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end mt-4 gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setCategoryFilter("all");
                setDateFilter("");
                setSubscriptionFilter("all");
                setLocationFilter("all");
                setTimeFilter("future"); // Volver al valor por defecto
              }}
            >
              Limpiar filtros
            </Button>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-6">
            <p className="text-muted-foreground">
              Mostrando <span className="font-bold text-foreground">{sortedEvents.length}</span> eventos
              {totalCount > 0 && (
                <span> de <span className="font-bold text-foreground">{totalCount}</span> totales</span>
              )}
            </p>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Fecha (más reciente)</SelectItem>
                <SelectItem value="popular">Más popular</SelectItem>
                <SelectItem value="capacity">Capacidad</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">Cargando eventos...</p>
            </div>
          ) : sortedEvents.length > 0 ? (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedEvents.map((evento, index) => (
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
                      isFavorito={evento.is_favorito === true}
                      organizadorId={evento.organizador?.id}
                      descripcion={evento.descripcion}
                      categoriaId={evento.categoria?.id}
                      fechaInicio={evento.fecha_inicio}
                      fechaFin={evento.fecha_fin}
                    />
                  </div>
                ))}
              </div>

              {/* Controles de Paginación */}
              <div className="mt-12 flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    if (hasPreviousPage) {
                      setCurrentPage(prev => prev - 1);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
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
                  onClick={() => {
                    if (hasNextPage) {
                      setCurrentPage(prev => prev + 1);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  disabled={!hasNextPage}
                  className="h-10 w-10"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <SearchIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No se encontraron eventos</h3>
              <p className="text-muted-foreground mb-6">
                Intenta cambiar los filtros o el término de búsqueda
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setCategoryFilter("all");
                    setDateFilter("");
                    setSubscriptionFilter("all");
                    setLocationFilter("all");
                    setTimeFilter("future"); // Volver al valor por defecto
                  }}
                >
                  Limpiar filtros
                </Button>
                <Button
                  onClick={() => navigate("/dashboard/create")}
                  className="gradient-primary text-white border-0"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Crear primer evento
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Search;
