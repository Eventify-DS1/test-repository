import Sidebar from "@/components/layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Calendar, MapPin, Loader2, Eye } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getRateableEventsRequest } from "@/api/reviews";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface RateableEvent {
  id: number;
  titulo: string;
  descripcion: string;
  fecha_inicio: string;
  fecha_fin: string;
  ubicacion: string;
  categoria: {
    id: number;
    nombre: string;
  } | null;
}

// Componente para cada evento individual
interface EventRatingCardProps {
  event: RateableEvent;
}

const EventRatingCard = ({ event }: EventRatingCardProps) => {
  const navigate = useNavigate();

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "d 'de' MMMM, yyyy", { locale: es });
  };

  const handleViewDetails = () => {
    navigate(`/dashboard/event/${event.id}`, { state: { fromRateEvents: true } });
  };

  const handleRateClick = () => {
    navigate(`/dashboard/rate/${event.id}`, { state: { fromRateEvents: true } });
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="text-xl mb-2">{event.titulo}</CardTitle>
        <div className="flex gap-4 text-sm text-muted-foreground flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <span>{formatDate(event.fecha_fin)}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <span>{event.ubicacion}</span>
          </div>
          {event.categoria && (
            <Badge variant="outline" className="text-xs">
              {event.categoria.nombre}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardFooter className="flex gap-2">
        <Button
          variant="outline"
          onClick={handleViewDetails}
          className="flex-1"
        >
          <Eye className="mr-2 h-4 w-4" />
          Ver detalles
        </Button>
        <Button
          onClick={handleRateClick}
          className="flex-1 gradient-primary text-white border-0"
        >
          <Star className="mr-2 h-4 w-4" />
          Calificar
        </Button>
      </CardFooter>
    </Card>
  );
};

const RateEvents = () => {
  // Obtener eventos calificables
  const { data: events, isLoading, error } = useQuery({
    queryKey: ['rateable-events'],
    queryFn: async () => {
      const response = await getRateableEventsRequest();
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full">
        <Sidebar />
        <main className="flex-1 p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen w-full">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="text-center">
            <p className="text-destructive">Error al cargar eventos</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      
      <main className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Calificar Eventos</h1>
          <p className="text-muted-foreground">
            Comparte tu experiencia en los eventos a los que asististe
          </p>
        </div>

        <div className="max-w-4xl space-y-6">
          {events && events.length > 0 ? (
            events.map((event: RateableEvent) => (
              <EventRatingCard
                key={event.id}
                event={event}
              />
            ))
          ) : (
            <Card className="shadow-card">
              <CardContent className="p-12 text-center">
                <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No tienes eventos para calificar
                </h3>
                <p className="text-muted-foreground">
                  Los eventos aparecerán aquí después de que finalicen y hayas asistido
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default RateEvents;
