import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import EventCard from "@/components/events/EventCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Users, Loader2, AlertCircle, History, Star, BarChart3, Download, CheckCircle, XCircle, TrendingUp, Search as SearchIcon, Filter } from "lucide-react";
import { getImageUrl } from "@/utils/imageHelpers";
import { getCategoriasRequest } from "@/api/auth";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import { 
  getMyCreatedEventsRequest,
  getAllSubscribedEventsRequest,
  getPastSubscribedEventsRequest,
  getPastCreatedEventsRequest,
  getFavoriteEventsRequest,
  getMisEventosReportesRequest,
  getReporteOrganizadorRequest,
  exportarReporteCSV
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
  organizadorId?: number;
  descripcion?: string;
  categoriaId?: number;
  fechaInicio?: string;
  fechaFin?: string;
  isFavorito?: boolean;
}

// Interface para categorías
interface Categoria {
  id: number;
  nombre: string;
}

const MisEventos = () => {
  const navigate = useNavigate();
  const [eventosInscritos, setEventosInscritos] = useState<EventoMapeado[]>([]);
  const [eventosCreados, setEventosCreados] = useState<EventoMapeado[]>([]);
  const [eventosFavoritos, setEventosFavoritos] = useState<EventoMapeado[]>([]);
  const [eventosPasadosInscritos, setEventosPasadosInscritos] = useState<EventoMapeado[]>([]);
  const [eventosPasadosCreados, setEventosPasadosCreados] = useState<EventoMapeado[]>([]);
  const [loadingInscritos, setLoadingInscritos] = useState(true);
  const [loadingCreados, setLoadingCreados] = useState(true);
  const [loadingFavoritos, setLoadingFavoritos] = useState(true);
  const [loadingPasadosInscritos, setLoadingPasadosInscritos] = useState(true);
  const [loadingPasadosCreados, setLoadingPasadosCreados] = useState(true);
  const [errorInscritos, setErrorInscritos] = useState<string | null>(null);
  const [errorCreados, setErrorCreados] = useState<string | null>(null);
  const [errorFavoritos, setErrorFavoritos] = useState<string | null>(null);
  const [errorPasadosInscritos, setErrorPasadosInscritos] = useState<string | null>(null);
  const [errorPasadosCreados, setErrorPasadosCreados] = useState<string | null>(null);

  // Estados para búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date");
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  // Estados para reportes
  const [reportesData, setReportesData] = useState<any>(null);
  const [eventoSeleccionado, setEventoSeleccionado] = useState<number | null>(null);
  const [reporteDetallado, setReporteDetallado] = useState<any>(null);
  const [loadingReportes, setLoadingReportes] = useState(true);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [errorReportes, setErrorReportes] = useState<string | null>(null);

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

  // Función para mapear eventos del backend al formato de EventCard
  const mapEventToCard = (evento: EventoBackend): EventoMapeado => {
    return {
      id: evento.id.toString(),
      title: evento.titulo,
      category: evento.categoria?.nombre || "Sin categoría",
      date: formatDate(evento.fecha_inicio),
      time: formatTime(evento.fecha_inicio),
      location: evento.ubicacion,
      capacity: evento.aforo,
      registered: evento.numero_inscritos || 0,
      image: getImageUrl(evento.foto),
      organizadorId: evento.organizador?.id,
      descripcion: evento.descripcion,
      categoriaId: evento.categoria?.id,
      fechaInicio: evento.fecha_inicio,
      fechaFin: evento.fecha_fin,
      isFavorito: evento.is_favorito === true,
    };
  };

  // Cargar categorías
  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const categoriasResponse = await getCategoriasRequest();
        const categoriasData = categoriasResponse.data.results || categoriasResponse.data;
        setCategorias(Array.isArray(categoriasData) ? categoriasData : []);
      } catch (error) {
        console.error('Error al cargar categorías:', error);
      }
    };

    fetchCategorias();
  }, []);

  // Cargar eventos inscritos
  useEffect(() => {
    const fetchInscritos = async () => {
      try {
        setLoadingInscritos(true);
        setErrorInscritos(null);
        const response = await getAllSubscribedEventsRequest();
        const eventos = Array.isArray(response.data) ? response.data : [];
        const eventosMapeados = eventos.map(mapEventToCard);
        setEventosInscritos(eventosMapeados);
      } catch (error: any) {
        console.error('Error al cargar eventos inscritos:', error);
        setErrorInscritos(
          error.response?.data?.detail || 
          'Error al cargar eventos inscritos. Por favor, intenta de nuevo.'
        );
        setEventosInscritos([]);
      } finally {
        setLoadingInscritos(false);
      }
    };

    fetchInscritos();
  }, []);

  // Cargar eventos creados
  useEffect(() => {
    const fetchCreados = async () => {
      try {
        setLoadingCreados(true);
        setErrorCreados(null);
        const response = await getMyCreatedEventsRequest();
        const eventos = Array.isArray(response.data) ? response.data : [];
        const eventosMapeados = eventos.map(mapEventToCard);
        setEventosCreados(eventosMapeados);
      } catch (error: any) {
        console.error('Error al cargar eventos creados:', error);
        setErrorCreados(
          error.response?.data?.detail || 
          'Error al cargar eventos creados. Por favor, intenta de nuevo.'
        );
        setEventosCreados([]);
      } finally {
        setLoadingCreados(false);
      }
    };

    fetchCreados();
  }, []);

  // Cargar eventos favoritos
  useEffect(() => {
    const fetchFavoritos = async () => {
      try {
        setLoadingFavoritos(true);
        setErrorFavoritos(null);
        const response = await getFavoriteEventsRequest();
        const eventos = Array.isArray(response.data) ? response.data : [];
        const eventosMapeados = eventos.map(mapEventToCard);
        setEventosFavoritos(eventosMapeados);
      } catch (error: any) {
        console.error('Error al cargar eventos favoritos:', error);
        setErrorFavoritos(
          error.response?.data?.detail || 
          'Error al cargar eventos favoritos. Por favor, intenta de nuevo.'
        );
        setEventosFavoritos([]);
      } finally {
        setLoadingFavoritos(false);
      }
    };

    fetchFavoritos();
  }, []);

  // Cargar eventos pasados inscritos
  useEffect(() => {
    const fetchPasadosInscritos = async () => {
      try {
        setLoadingPasadosInscritos(true);
        setErrorPasadosInscritos(null);
        const response = await getPastSubscribedEventsRequest();
        const eventos = Array.isArray(response.data) ? response.data : [];
        const eventosMapeados = eventos.map(mapEventToCard);
        setEventosPasadosInscritos(eventosMapeados);
      } catch (error: any) {
        console.error('Error al cargar eventos pasados inscritos:', error);
        setErrorPasadosInscritos(
          error.response?.data?.detail || 
          'Error al cargar eventos pasados inscritos. Por favor, intenta de nuevo.'
        );
        setEventosPasadosInscritos([]);
      } finally {
        setLoadingPasadosInscritos(false);
      }
    };

    fetchPasadosInscritos();
  }, []);

  // Cargar eventos pasados creados
  useEffect(() => {
    const fetchPasadosCreados = async () => {
      try {
        setLoadingPasadosCreados(true);
        setErrorPasadosCreados(null);
        const response = await getPastCreatedEventsRequest();
        const eventos = Array.isArray(response.data) ? response.data : [];
        const eventosMapeados = eventos.map(mapEventToCard);
        setEventosPasadosCreados(eventosMapeados);
      } catch (error: any) {
        console.error('Error al cargar eventos pasados creados:', error);
        setErrorPasadosCreados(
          error.response?.data?.detail || 
          'Error al cargar eventos pasados creados. Por favor, intenta de nuevo.'
        );
        setEventosPasadosCreados([]);
      } finally {
        setLoadingPasadosCreados(false);
      }
    };

    fetchPasadosCreados();
  }, []);

  // Cargar reportes de eventos del organizador
  useEffect(() => {
    const fetchReportes = async () => {
      try {
        setLoadingReportes(true);
        setErrorReportes(null);
        const response = await getMisEventosReportesRequest();
        setReportesData(response.data);
        
        if (response.data.eventos.length > 0) {
          setEventoSeleccionado(response.data.eventos[0].evento_id);
        }
      } catch (error: any) {
        console.error('Error al cargar reportes:', error);
        setErrorReportes('Error al cargar los reportes. Por favor, intenta de nuevo.');
      } finally {
        setLoadingReportes(false);
      }
    };

    fetchReportes();
  }, []);

  // Cargar detalle del evento seleccionado
  useEffect(() => {
    if (!eventoSeleccionado) return;

    const fetchDetalle = async () => {
      try {
        setLoadingDetalle(true);
        const response = await getReporteOrganizadorRequest(eventoSeleccionado);
        setReporteDetallado(response.data);
      } catch (error: any) {
        console.error('Error al cargar detalle:', error);
      } finally {
        setLoadingDetalle(false);
      }
    };

    fetchDetalle();
  }, [eventoSeleccionado]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const prepararDatosOcupacion = () => {
    if (!reportesData) return [];
    return reportesData.eventos.map((e: any) => ({
      nombre: e.titulo.substring(0, 20) + (e.titulo.length > 20 ? '...' : ''),
      inscritos: e.total_inscritos,
      aforo: e.aforo
    }));
  };

  const prepararDatosConfirmacion = () => {
    if (!reporteDetallado) return [];
    return [
      { name: 'Confirmados', value: reporteDetallado.estadisticas.confirmados },
      { name: 'Pendientes', value: reporteDetallado.estadisticas.pendientes }
    ];
  };

  // Combinar eventos pasados para el historial
  const eventosPasadosCombinados = [...eventosPasadosInscritos, ...eventosPasadosCreados];
  const loadingPasados = loadingPasadosInscritos || loadingPasadosCreados;
  const errorPasados = errorPasadosInscritos || errorPasadosCreados;

  // Función para filtrar eventos según los filtros aplicados
  const filterEvents = (eventos: EventoMapeado[]): EventoMapeado[] => {
    return eventos.filter(evento => {
      // Filtro por búsqueda (nombre)
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        if (!evento.title.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Filtro por categoría
      if (categoryFilter !== "all") {
        const categoriaId = parseInt(categoryFilter);
        if (evento.categoriaId !== categoriaId) {
          return false;
        }
      }

      // Filtro por fecha
      if (dateFilter && evento.fechaInicio) {
        const eventoDate = new Date(evento.fechaInicio).toISOString().split('T')[0];
        if (eventoDate !== dateFilter) {
          return false;
        }
      }

      // Filtro por ubicación
      if (locationFilter !== "all") {
        if (evento.location !== locationFilter) {
          return false;
        }
      }

      return true;
    });
  };

  // Función para ordenar eventos
  const sortEvents = (eventos: EventoMapeado[]): EventoMapeado[] => {
    const sorted = [...eventos];
    
    switch (sortBy) {
      case "date":
        // Fecha (más reciente primero)
        return sorted.sort((a, b) => {
          const dateA = a.fechaInicio ? new Date(a.fechaInicio).getTime() : 0;
          const dateB = b.fechaInicio ? new Date(b.fechaInicio).getTime() : 0;
          return dateB - dateA;
        });
      
      case "popular":
        // Más popular (más inscritos primero)
        return sorted.sort((a, b) => b.registered - a.registered);
      
      case "capacity":
        // Capacidad (mayor capacidad primero)
        return sorted.sort((a, b) => b.capacity - a.capacity);
      
      case "name":
        // Nombre (alfabético)
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      
      default:
        return sorted;
    }
  };

  // Aplicar filtros y ordenamiento a cada lista
  const eventosInscritosFiltrados = sortEvents(filterEvents(eventosInscritos));
  const eventosCreadosFiltrados = sortEvents(filterEvents(eventosCreados));
  const eventosFavoritosFiltrados = sortEvents(filterEvents(eventosFavoritos));
  const eventosPasadosInscritosFiltrados = sortEvents(filterEvents(eventosPasadosInscritos));
  const eventosPasadosCreadosFiltrados = sortEvents(filterEvents(eventosPasadosCreados));
  const eventosPasadosCombinadosFiltrados = sortEvents(filterEvents(eventosPasadosCombinados));

  // Obtener ubicaciones únicas de todos los eventos
  const getAllLocations = (): string[] => {
    const allEventos = [
      ...eventosInscritos,
      ...eventosCreados,
      ...eventosFavoritos,
      ...eventosPasadosInscritos,
      ...eventosPasadosCreados
    ];
    return Array.from(new Set(allEventos.map(e => e.location).filter(Boolean)));
  };

  const ubicaciones = getAllLocations();

  // Función para limpiar filtros
  const clearFilters = () => {
    setSearchTerm("");
    setCategoryFilter("all");
    setDateFilter("");
    setLocationFilter("all");
    setSortBy("date");
    toast.success("Filtros limpiados");
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Mis Eventos</h1>
            <p className="text-gray-600">
              Gestiona tus eventos y revisa aquellos en los que estás inscrito
            </p>
          </div>

          {/* Barra de búsqueda y filtros */}
          <Card className="mb-6">
            <CardContent className="pt-6">
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

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Fecha (más reciente)</SelectItem>
                    <SelectItem value="popular">Más popular</SelectItem>
                    <SelectItem value="capacity">Capacidad</SelectItem>
                    <SelectItem value="name">Nombre (A-Z)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end mt-4 gap-2">
                <Button
                  variant="outline"
                  onClick={clearFilters}
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
            </CardContent>
          </Card>

          <Tabs defaultValue="inscritos" className="w-full">
            <TabsList className="grid w-full max-w-4xl grid-cols-5 mb-6">
              <TabsTrigger value="inscritos" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Inscritos
                {eventosInscritosFiltrados.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                    {eventosInscritosFiltrados.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="creados" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Creados
                {eventosCreadosFiltrados.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                    {eventosCreadosFiltrados.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="favoritos" className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                Favoritos
                {eventosFavoritosFiltrados.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded-full">
                    {eventosFavoritosFiltrados.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="historial" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                Historial
                {eventosPasadosCombinadosFiltrados.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded-full">
                    {eventosPasadosCombinadosFiltrados.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="reportes" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Reportes
              </TabsTrigger>
            </TabsList>

            {/* Sección: Eventos Inscritos */}
            <TabsContent value="inscritos" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    Eventos en los que estoy inscrito
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingInscritos ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                      <span className="ml-2 text-gray-600">Cargando eventos...</span>
                    </div>
                  ) : errorInscritos ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                      <p className="text-red-600 mb-4">{errorInscritos}</p>
                      <Button 
                        variant="outline" 
                        onClick={() => window.location.reload()}
                      >
                        Reintentar
                      </Button>
                    </div>
                  ) : eventosInscritosFiltrados.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Calendar className="h-16 w-16 text-gray-300 mb-4" />
                      <p className="text-gray-600 text-lg mb-2">
                        {eventosInscritos.length === 0 
                          ? "No tienes eventos inscritos"
                          : "No se encontraron eventos con los filtros aplicados"}
                      </p>
                      <p className="text-gray-500 text-sm mb-4">
                        {eventosInscritos.length === 0
                          ? "Explora eventos y únete a los que te interesen"
                          : "Intenta cambiar los filtros de búsqueda"}
                      </p>
                      {eventosInscritos.length === 0 ? (
                        <Button onClick={() => navigate('/dashboard/search')}>
                          Buscar Eventos
                        </Button>
                      ) : (
                        <Button variant="outline" onClick={clearFilters}>
                          Limpiar filtros
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {eventosInscritosFiltrados.map((evento) => (
                        <EventCard
                          key={evento.id}
                          id={evento.id}
                          title={evento.title}
                          category={evento.category}
                          date={evento.date}
                          time={evento.time}
                          location={evento.location}
                          capacity={evento.capacity}
                          registered={evento.registered}
                          image={evento.image}
                          skipAuthCheck={false}
                          organizadorId={evento.organizadorId}
                          descripcion={evento.descripcion}
                          categoriaId={evento.categoriaId}
                          fechaInicio={evento.fechaInicio}
                          fechaFin={evento.fechaFin}
                          isFavorito={evento.isFavorito}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Sección: Eventos Creados */}
            <TabsContent value="creados" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-green-600" />
                    Eventos que he creado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingCreados ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                      <span className="ml-2 text-gray-600">Cargando eventos...</span>
                    </div>
                  ) : errorCreados ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                      <p className="text-red-600 mb-4">{errorCreados}</p>
                      <Button 
                        variant="outline" 
                        onClick={() => window.location.reload()}
                      >
                        Reintentar
                      </Button>
                    </div>
                  ) : eventosCreadosFiltrados.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Users className="h-16 w-16 text-gray-300 mb-4" />
                      <p className="text-gray-600 text-lg mb-2">
                        {eventosCreados.length === 0 
                          ? "No has creado ningún evento"
                          : "No se encontraron eventos con los filtros aplicados"}
                      </p>
                      <p className="text-gray-500 text-sm mb-4">
                        {eventosCreados.length === 0
                          ? "Crea tu primer evento y compártelo con la comunidad"
                          : "Intenta cambiar los filtros de búsqueda"}
                      </p>
                      {eventosCreados.length === 0 ? (
                        <Button onClick={() => navigate('/dashboard/create')}>
                          Crear Evento
                        </Button>
                      ) : (
                        <Button variant="outline" onClick={clearFilters}>
                          Limpiar filtros
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {eventosCreadosFiltrados.map((evento) => (
                        <EventCard
                          key={evento.id}
                          id={evento.id}
                          title={evento.title}
                          category={evento.category}
                          date={evento.date}
                          time={evento.time}
                          location={evento.location}
                          capacity={evento.capacity}
                          registered={evento.registered}
                          image={evento.image}
                          skipAuthCheck={false}
                          organizadorId={evento.organizadorId}
                          descripcion={evento.descripcion}
                          categoriaId={evento.categoriaId}
                          fechaInicio={evento.fechaInicio}
                          fechaFin={evento.fechaFin}
                          isFavorito={evento.isFavorito}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Sección: Eventos Favoritos */}
            <TabsContent value="favoritos" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-600" />
                    Mis Eventos Favoritos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingFavoritos ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-yellow-600" />
                      <span className="ml-2 text-gray-600">Cargando favoritos...</span>
                    </div>
                  ) : errorFavoritos ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                      <p className="text-red-600 mb-4">{errorFavoritos}</p>
                      <Button 
                        variant="outline" 
                        onClick={() => window.location.reload()}
                      >
                        Reintentar
                      </Button>
                    </div>
                  ) : eventosFavoritosFiltrados.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Star className="h-16 w-16 text-gray-300 mb-4" />
                      <p className="text-gray-600 text-lg mb-2">
                        {eventosFavoritos.length === 0 
                          ? "No tienes eventos favoritos"
                          : "No se encontraron eventos con los filtros aplicados"}
                      </p>
                      <p className="text-gray-500 text-sm mb-4">
                        {eventosFavoritos.length === 0
                          ? "Marca eventos como favoritos para encontrarlos fácilmente"
                          : "Intenta cambiar los filtros de búsqueda"}
                      </p>
                      {eventosFavoritos.length > 0 && (
                        <Button variant="outline" onClick={clearFilters}>
                          Limpiar filtros
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {eventosFavoritosFiltrados.map((evento) => (
                        <EventCard
                          key={evento.id}
                          id={evento.id}
                          title={evento.title}
                          category={evento.category}
                          date={evento.date}
                          time={evento.time}
                          location={evento.location}
                          capacity={evento.capacity}
                          registered={evento.registered}
                          image={evento.image}
                          skipAuthCheck={false}
                          organizadorId={evento.organizadorId}
                          descripcion={evento.descripcion}
                          categoriaId={evento.categoriaId}
                          fechaInicio={evento.fechaInicio}
                          fechaFin={evento.fechaFin}
                          isFavorito={evento.isFavorito}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Sección: Historial de Eventos Pasados */}
            <TabsContent value="historial" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5 text-gray-600" />
                    Historial de Eventos Pasados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingPasados ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
                      <span className="ml-2 text-gray-600">Cargando historial...</span>
                    </div>
                  ) : errorPasados ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                      <p className="text-red-600 mb-4">{errorPasados}</p>
                      <Button 
                        variant="outline" 
                        onClick={() => window.location.reload()}
                      >
                        Reintentar
                      </Button>
                    </div>
                  ) : eventosPasadosCombinadosFiltrados.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <History className="h-16 w-16 text-gray-300 mb-4" />
                      <p className="text-gray-600 text-lg mb-2">
                        {eventosPasadosCombinados.length === 0 
                          ? "No hay eventos pasados"
                          : "No se encontraron eventos con los filtros aplicados"}
                      </p>
                      <p className="text-gray-500 text-sm mb-4">
                        {eventosPasadosCombinados.length === 0
                          ? "Los eventos que finalicen aparecerán aquí"
                          : "Intenta cambiar los filtros de búsqueda"}
                      </p>
                      {eventosPasadosCombinados.length > 0 && (
                        <Button variant="outline" onClick={clearFilters}>
                          Limpiar filtros
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div>
                      {eventosPasadosInscritosFiltrados.length > 0 && (
                        <div className="mb-8">
                          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-blue-600" />
                            Eventos Pasados en los que estuve inscrito ({eventosPasadosInscritosFiltrados.length})
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {eventosPasadosInscritosFiltrados.map((evento) => (
                              <EventCard
                                key={evento.id}
                                id={evento.id}
                                title={evento.title}
                                category={evento.category}
                                date={evento.date}
                                time={evento.time}
                                location={evento.location}
                                capacity={evento.capacity}
                                registered={evento.registered}
                                image={evento.image}
                                skipAuthCheck={false}
                                organizadorId={evento.organizadorId}
                                descripcion={evento.descripcion}
                                categoriaId={evento.categoriaId}
                                fechaInicio={evento.fechaInicio}
                                fechaFin={evento.fechaFin}
                                isFavorito={evento.isFavorito}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {eventosPasadosCreadosFiltrados.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <Users className="h-5 w-5 text-green-600" />
                            Eventos Pasados que creé ({eventosPasadosCreadosFiltrados.length})
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {eventosPasadosCreadosFiltrados.map((evento) => (
                              <EventCard
                                key={evento.id}
                                id={evento.id}
                                title={evento.title}
                                category={evento.category}
                                date={evento.date}
                                time={evento.time}
                                location={evento.location}
                                capacity={evento.capacity}
                                registered={evento.registered}
                                image={evento.image}
                                skipAuthCheck={false}
                                organizadorId={evento.organizadorId}
                                descripcion={evento.descripcion}
                                categoriaId={evento.categoriaId}
                                fechaInicio={evento.fechaInicio}
                                fechaFin={evento.fechaFin}
                                isFavorito={evento.isFavorito}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* SECCIÓN: REPORTES */}
            <TabsContent value="reportes" className="mt-6">
              {loadingReportes ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-600">Cargando reportes...</span>
                </div>
              ) : errorReportes ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center justify-center py-12">
                      <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                      <p className="text-red-600 mb-4">{errorReportes}</p>
                      <Button variant="outline" onClick={() => window.location.reload()}>
                        Reintentar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : reportesData && reportesData.eventos.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center justify-center py-12">
                      <BarChart3 className="h-16 w-16 text-gray-300 mb-4" />
                      <p className="text-gray-600 text-lg mb-2">No has creado eventos aún</p>
                      <p className="text-gray-500 text-sm mb-4">
                        Crea tu primer evento para ver estadísticas y reportes
                      </p>
                      <Button onClick={() => navigate('/dashboard/create')}>
                        Crear Evento
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {/* Resumen General */}
                  <div className="grid md:grid-cols-4 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          Eventos Creados
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{reportesData.resumen.total_eventos}</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <Users className="h-4 w-4 text-green-600" />
                          Total Inscritos
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{reportesData.resumen.total_inscritos}</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-purple-600" />
                          Confirmados
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{reportesData.resumen.total_confirmados}</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-amber-600" />
                          Ocupación Promedio
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{reportesData.resumen.promedio_ocupacion.toFixed(1)}%</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Gráfica de Ocupación */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Ocupación por Evento</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={prepararDatosOcupacion()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="nombre" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="inscritos" fill="#3b82f6" name="Inscritos" />
                          <Bar dataKey="aforo" fill="#d1d5db" name="Aforo Total" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Selector de Evento y Detalle */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Detalle de Evento</CardTitle>
                        <select
                          className="border rounded px-3 py-2 bg-white"
                          value={eventoSeleccionado || ''}
                          onChange={(e) => setEventoSeleccionado(Number(e.target.value))}
                        >
                          {reportesData.eventos.map((evento: any) => (
                            <option key={evento.evento_id} value={evento.evento_id}>
                              {evento.titulo}
                            </option>
                          ))}
                        </select>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {loadingDetalle ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                        </div>
                      ) : reporteDetallado ? (
                        <div className="space-y-6">
                          {/* Info del Evento */}
                          <div className="bg-blue-50 rounded-lg p-4">
                            <h3 className="font-semibold text-lg mb-2">{reporteDetallado.evento.titulo}</h3>
                            <div className="grid md:grid-cols-2 gap-2 text-sm">
                              <p><span className="font-medium">Ubicación:</span> {reporteDetallado.evento.ubicacion}</p>
                              <p><span className="font-medium">Categoría:</span> {reporteDetallado.evento.categoria}</p>
                              <p><span className="font-medium">Código:</span> <span className="font-mono bg-white px-2 py-1 rounded">{reporteDetallado.evento.codigo_confirmacion}</span></p>
                              <p><span className="font-medium">Aforo:</span> {reporteDetallado.evento.aforo} personas</p>
                            </div>
                          </div>

                          {/* Estadísticas */}
                          <div className="grid md:grid-cols-2 gap-6">
                            {/* Gráfica de Confirmación */}
                            <div>
                              <h4 className="font-semibold mb-4">Estado de Asistencia</h4>
                              {reporteDetallado.estadisticas.total_inscritos > 0 ? (
                                <ResponsiveContainer width="100%" height={250}>
                                  <PieChart>
                                    <Pie
                                      data={prepararDatosConfirmacion()}
                                      cx="50%"
                                      cy="50%"
                                      labelLine={false}
                                      label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                      outerRadius={80}
                                      fill="#8884d8"
                                      dataKey="value"
                                    >
                                      {prepararDatosConfirmacion().map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                      ))}
                                    </Pie>
                                    <Tooltip />
                                  </PieChart>
                                </ResponsiveContainer>
                              ) : (
                                <div className="flex items-center justify-center h-64 text-gray-400">
                                  <p>No hay inscritos aún</p>
                                </div>
                              )}
                            </div>

                            {/* Métricas */}
                            <div className="space-y-4">
                              <div className="border rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm text-gray-600">Porcentaje de Confirmación</span>
                                  <CheckCircle className="h-5 w-5 text-green-600" />
                                </div>
                                <div className="text-3xl font-bold text-green-600">
                                  {reporteDetallado.estadisticas.porcentaje_confirmacion.toFixed(1)}%
                                </div>
                              </div>

                              <div className="border rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm text-gray-600">Cupos Disponibles</span>
                                  <Users className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="text-3xl font-bold text-blue-600">
                                  {reporteDetallado.estadisticas.cupos_disponibles}
                                </div>
                              </div>

                              <div className="border rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm text-gray-600">Calificación Promedio</span>
                                  <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                                </div>
                                <div className="text-3xl font-bold text-amber-600">
                                  {reporteDetallado.estadisticas.promedio_calificacion > 0 
                                    ? `${reporteDetallado.estadisticas.promedio_calificacion.toFixed(1)} / 5`
                                    : 'Sin calificaciones'
                                  }
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  {reporteDetallado.estadisticas.total_reseñas} reseñas
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Lista de Inscritos */}
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="font-semibold">
                                Lista de Inscritos ({reporteDetallado.inscritos.length})
                              </h4>
                              {reporteDetallado.inscritos.length > 0 && (
                                <Button
                                  size="sm"
                                  onClick={() => exportarReporteCSV(eventoSeleccionado!)}
                                  className="flex items-center gap-2"
                                >
                                  <Download className="h-4 w-4" />
                                  Exportar CSV
                                </Button>
                              )}
                            </div>

                            {reporteDetallado.inscritos.length > 0 ? (
                              <div className="border rounded-lg overflow-hidden">
                                <div className="max-h-96 overflow-y-auto">
                                  <table className="w-full">
                                    <thead className="bg-gray-50 sticky top-0">
                                      <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                                      </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                      {reporteDetallado.inscritos.map((inscrito: any) => (
                                        <tr key={inscrito.id} className="hover:bg-gray-50">
                                          <td className="px-4 py-3 text-sm">{inscrito.nombre_completo}</td>
                                          <td className="px-4 py-3 text-sm text-gray-600">{inscrito.email}</td>
                                          <td className="px-4 py-3 text-sm font-mono">{inscrito.codigo_estudiantil || 'N/A'}</td>
                                          <td className="px-4 py-3">
                                            {inscrito.asistencia_confirmada ? (
                                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                                                <CheckCircle className="h-3 w-3" />
                                                Confirmado
                                              </span>
                                            ) : (
                                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-700">
                                                <XCircle className="h-3 w-3" />
                                                Pendiente
                                              </span>
                                            )}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            ) : (
                              <div className="border rounded-lg p-8 text-center text-gray-400">
                                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                <p>No hay inscritos en este evento todavía</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default MisEventos;