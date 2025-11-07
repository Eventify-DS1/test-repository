import { useState, useEffect } from "react";
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
import { getEventosStatsRequest, getEventosRequest, getCategoriasRequest, verifyTokenRequest } from "@/api/auth";
import { toast } from "sonner";
import { getImageUrl } from "@/utils/imageHelpers";

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
  const [totalEventos, setTotalEventos] = useState(0);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);


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


  useEffect(() => {
    const fetchEventos = async () => {
      try {
        setLoading(true);
        const params: any = {};
        
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
      } catch (error) {
        console.error('Error al cargar eventos:', error);
        setEventos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEventos();
  }, [searchTerm, categoryFilter]);


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

  const filteredEvents = dateFilter 
    ? eventos.filter(evento => {
        const eventoDate = new Date(evento.fecha_inicio).toISOString().split('T')[0];
        return eventoDate === dateFilter;
      })
    : eventos;

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
          
          <div className="grid md:grid-cols-4 gap-4">
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
              Mostrando <span className="font-bold text-foreground">{filteredEvents.length}</span> de{" "}
              <span className="font-bold text-foreground">{totalEventos}</span> eventos
            </p>
            <Select defaultValue="date">
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
          ) : filteredEvents.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
