import { useState, useEffect, useMemo } from "react";
import { Search as SearchIcon, Filter, Plus } from "lucide-react";
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
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
  const [sortBy, setSortBy] = useState<string>("date"); // date, popular, capacity
  const [totalEventos, setTotalEventos] = useState(0);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [subscribedEventIds, setSubscribedEventIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const [count, setCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [allEventos, setAllEventos] = useState<Evento[]>([]); // Para almacenar todos los eventos cuando ordenamos por fecha


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


  useEffect(() => {
    const fetchEventos = async () => {
      try {
        setLoading(true);
        
        // Si ordenamos por fecha, necesitamos cargar todos los eventos para ordenarlos correctamente
        // antes de paginar
        if (sortBy === "date") {
          const params: any = {
            page_size: 1000, // Cargar una cantidad grande de eventos
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

          const response = await getEventosRequest(params);
          let eventosData = response.data.results || response.data;
          eventosData = Array.isArray(eventosData) ? eventosData : [];
          
          // Si hay más páginas, cargarlas todas
          let nextUrl = response.data.next;
          while (nextUrl) {
            try {
              // Extraer solo el path de la URL (desde /api en adelante)
              const urlObj = new URL(nextUrl, window.location.origin);
              const path = urlObj.pathname + urlObj.search;
              const nextResponse = await apiClient.get(path);
              const nextData = nextResponse.data.results || nextResponse.data;
              if (Array.isArray(nextData)) {
                eventosData = [...eventosData, ...nextData];
              }
              nextUrl = nextResponse.data.next;
            } catch (err) {
              console.error('Error al cargar página adicional:', err);
              break;
            }
          }
          
          setAllEventos(eventosData);
        } else {
          // Para otros ordenamientos, usar paginación normal del servidor
          const params: any = {
            page: page,
            page_size: pageSize,
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

          const response = await getEventosRequest(params);
          const eventosData = response.data.results || response.data;
          setEventos(Array.isArray(eventosData) ? eventosData : []);
          setAllEventos([]); // Limpiar cuando no usamos ordenamiento por fecha
          
          // Manejar información de paginación
          if (response.data.count !== undefined) {
            setCount(response.data.count);
            const calculatedTotalPages = Math.ceil(response.data.count / pageSize);
            setTotalPages(calculatedTotalPages > 0 ? calculatedTotalPages : 1);
          } else {
            // Si no hay count, usar el número de eventos recibidos
            const eventosCount = Array.isArray(eventosData) ? eventosData.length : 0;
            setCount(eventosCount);
            setTotalPages(1);
          }
          setHasNext(!!response.data.next);
          setHasPrevious(!!response.data.previous);
        }
      } catch (error) {
        console.error('Error al cargar eventos:', error);
        setEventos([]);
        setAllEventos([]);
        setCount(0);
        setTotalPages(1);
        setHasNext(false);
        setHasPrevious(false);
      } finally {
        setLoading(false);
      }
    };

    fetchEventos();
  }, [searchTerm, categoryFilter, page, pageSize, sortBy]);

  // Resetear página cuando cambian los filtros o el ordenamiento
  useEffect(() => {
    setPage(1);
  }, [searchTerm, categoryFilter, sortBy, dateFilter, subscriptionFilter]);


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

  // Usar allEventos cuando ordenamos por fecha, eventos en otros casos
  const eventosToProcess = sortBy === "date" ? allEventos : eventos;

  const filteredEvents = useMemo(() => {
    return eventosToProcess.filter(evento => {
      // Filtro por fecha
      if (dateFilter) {
        const eventoDate = new Date(evento.fecha_inicio).toISOString().split('T')[0];
        if (eventoDate !== dateFilter) {
          return false;
        }
      }

      // Filtro por inscripción (solo aplicar si las inscripciones ya se cargaron)
      if (!loadingSubscriptions) {
        // Asegurar que el ID del evento sea un número para la comparación
        const eventoId = Number(evento.id);
        
        if (subscriptionFilter === "subscribed") {
          // Solo eventos donde el usuario está inscrito
          // Verificar que el ID del evento esté en el Set de eventos inscritos
          if (!subscribedEventIds.has(eventoId)) {
            return false;
          }
        } else if (subscriptionFilter === "not_subscribed") {
          // Solo eventos donde el usuario NO está inscrito
          // Verificar que el ID del evento NO esté en el Set de eventos inscritos
          if (subscribedEventIds.has(eventoId)) {
            return false;
          }
        }
      }
      // Si subscriptionFilter === "all", no filtrar por inscripción
      // Si loadingSubscriptions === true, no filtrar por inscripción hasta que se carguen

      return true;
    });
  }, [eventosToProcess, dateFilter, subscriptionFilter, loadingSubscriptions, subscribedEventIds]);

  // Ordenar eventos según el criterio seleccionado
  const sortedEvents = useMemo(() => {
    return [...filteredEvents].sort((a, b) => {
      switch (sortBy) {
        case "date":
          // Primero eventos no finalizados (del más cercano al más lejano)
          // Luego eventos finalizados (del más cercano al más antiguo)
          const ahora = new Date().getTime();
          const fechaFinA = new Date(a.fecha_fin).getTime();
          const fechaFinB = new Date(b.fecha_fin).getTime();
          const fechaInicioA = new Date(a.fecha_inicio).getTime();
          const fechaInicioB = new Date(b.fecha_inicio).getTime();
          
          const aFinalizado = fechaFinA < ahora;
          const bFinalizado = fechaFinB < ahora;
          
          // Si uno está finalizado y el otro no, el no finalizado va primero
          if (aFinalizado && !bFinalizado) {
            return 1; // b va primero (no finalizado)
          }
          if (!aFinalizado && bFinalizado) {
            return -1; // a va primero (no finalizado)
          }
          
          // Si ambos están en el mismo estado (finalizados o no finalizados)
          if (!aFinalizado && !bFinalizado) {
            // Ambos no finalizados: ordenar por fecha_inicio ascendente (más cercano primero)
            return fechaInicioA - fechaInicioB;
          } else {
            // Ambos finalizados: ordenar por fecha_fin descendente (más cercano al más antiguo)
            return fechaFinB - fechaFinA;
          }
        
        case "popular":
          // Más popular (más inscritos primero)
          const inscritosA = a.numero_inscritos || 0;
          const inscritosB = b.numero_inscritos || 0;
          return inscritosB - inscritosA;
        
        case "capacity":
          // Capacidad (mayor capacidad primero)
          return b.aforo - a.aforo;
        
        default:
          return 0;
      }
    });
  }, [filteredEvents, sortBy]);

  // Aplicar paginación del cliente cuando ordenamos por fecha
  const paginatedEvents = useMemo(() => {
    return sortBy === "date" 
      ? sortedEvents.slice((page - 1) * pageSize, page * pageSize)
      : sortedEvents;
  }, [sortBy, sortedEvents, page, pageSize]);
  
  // Actualizar información de paginación cuando ordenamos por fecha (solo en cliente)
  useEffect(() => {
    if (sortBy === "date") {
      const totalCount = sortedEvents.length;
      setCount(totalCount);
      const calculatedTotalPages = Math.ceil(totalCount / pageSize);
      setTotalPages(calculatedTotalPages > 0 ? calculatedTotalPages : 1);
      setHasNext(page < calculatedTotalPages);
      setHasPrevious(page > 1);
    }
    // Cuando no ordenamos por fecha, la paginación viene del servidor en fetchEventos
  }, [sortBy, sortedEvents, page, pageSize]);

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

            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Todas las ubicaciones" />
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

          <div className="flex justify-end mt-4 gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setCategoryFilter("all");
                setDateFilter("");
                setSubscriptionFilter("all");
                setPage(1);
              }}
            >
              Limpiar filtros
            </Button>
            <Button 
              className="gradient-primary text-white border-0"
              onClick={() => {
                toast.success("Filtros aplicados");
              }}
            >
              <SearchIcon className="mr-2 h-4 w-4" />
              Buscar
            </Button>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-6">
            <p className="text-muted-foreground">
              Mostrando <span className="font-bold text-foreground">
                {sortBy === "date" 
                  ? `${Math.min((page - 1) * pageSize + 1, count)}-${Math.min(page * pageSize, count)}`
                  : paginatedEvents.length
                }
              </span> de{" "}
              <span className="font-bold text-foreground">{count || totalEventos}</span> eventos
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
          ) : paginatedEvents.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedEvents.map((evento, index) => (
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
                    setPage(1);
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

          {/* Paginación */}
          {!loading && paginatedEvents.length > 0 && totalPages > 1 && (
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
        </div>
      </main>
    </div>
  );
};

export default Search;
