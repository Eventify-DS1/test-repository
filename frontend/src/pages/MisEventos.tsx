import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import EventCard from "@/components/events/EventCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Users, Loader2, AlertCircle, History, Star, BarChart3, Download, CheckCircle, XCircle, TrendingUp } from "lucide-react";
import { getImageUrl } from "@/utils/imageHelpers";
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

          <Tabs defaultValue="inscritos" className="w-full">
            <TabsList className="grid w-full max-w-4xl grid-cols-5 mb-6">
              <TabsTrigger value="inscritos" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Inscritos
                {eventosInscritos.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                    {eventosInscritos.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="creados" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Creados
                {eventosCreados.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                    {eventosCreados.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="favoritos" className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                Favoritos
                {eventosFavoritos.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded-full">
                    {eventosFavoritos.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="historial" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                Historial
                {eventosPasadosCombinados.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded-full">
                    {eventosPasadosCombinados.length}
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
                  ) : eventosInscritos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Calendar className="h-16 w-16 text-gray-300 mb-4" />
                      <p className="text-gray-600 text-lg mb-2">No tienes eventos inscritos</p>
                      <p className="text-gray-500 text-sm mb-4">
                        Explora eventos y únete a los que te interesen
                      </p>
                      <Button onClick={() => navigate('/dashboard/search')}>
                        Buscar Eventos
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {eventosInscritos.map((evento) => (
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
                  ) : eventosCreados.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Users className="h-16 w-16 text-gray-300 mb-4" />
                      <p className="text-gray-600 text-lg mb-2">No has creado ningún evento</p>
                      <p className="text-gray-500 text-sm mb-4">
                        Crea tu primer evento y compártelo con la comunidad
                      </p>
                      <Button onClick={() => navigate('/dashboard/create')}>
                        Crear Evento
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {eventosCreados.map((evento) => (
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
                  ) : eventosFavoritos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Star className="h-16 w-16 text-gray-300 mb-4" />
                      <p className="text-gray-600 text-lg mb-2">No tienes eventos favoritos</p>
                      <p className="text-gray-500 text-sm">
                        Marca eventos como favoritos para encontrarlos fácilmente
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {eventosFavoritos.map((evento) => (
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
                  ) : eventosPasadosCombinados.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <History className="h-16 w-16 text-gray-300 mb-4" />
                      <p className="text-gray-600 text-lg mb-2">No hay eventos pasados</p>
                      <p className="text-gray-500 text-sm">
                        Los eventos que finalicen aparecerán aquí
                      </p>
                    </div>
                  ) : (
                    <div>
                      {eventosPasadosInscritos.length > 0 && (
                        <div className="mb-8">
                          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-blue-600" />
                            Eventos Pasados en los que estuve inscrito ({eventosPasadosInscritos.length})
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {eventosPasadosInscritos.map((evento) => (
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

                      {eventosPasadosCreados.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <Users className="h-5 w-5 text-green-600" />
                            Eventos Pasados que creé ({eventosPasadosCreados.length})
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {eventosPasadosCreados.map((evento) => (
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