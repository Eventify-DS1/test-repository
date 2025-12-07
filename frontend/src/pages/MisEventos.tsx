import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import EventCard from "@/components/events/EventCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Users, Loader2, AlertCircle, History, Star } from "lucide-react";
import { getImageUrl } from "@/utils/imageHelpers";
import { 
  getMyCreatedEventsRequest,
  getAllSubscribedEventsRequest,
  getPastSubscribedEventsRequest,
  getPastCreatedEventsRequest,
  getFavoriteEventsRequest
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
  const [showFavoritos, setShowFavoritos] = useState(false);

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
      isFavorito: evento.is_favorito === true, // Mapear explícitamente a boolean
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
            <TabsList className="grid w-full max-w-3xl grid-cols-4 mb-6">
              <TabsTrigger value="inscritos" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Eventos Inscritos
                {eventosInscritos.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                    {eventosInscritos.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="creados" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Mis Eventos Creados
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
                      {/* Eventos Pasados Inscritos */}
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

                      {/* Eventos Pasados Creados */}
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
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default MisEventos;

