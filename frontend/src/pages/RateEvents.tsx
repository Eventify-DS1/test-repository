import Sidebar from "@/components/layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Calendar, MapPin, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getRateableEventsRequest, 
  createReviewRequest 
} from "@/api/reviews";
import StarRating from "@/components/events/StarRating";
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

const RateEvents = () => {
  const queryClient = useQueryClient();
  const [ratings, setRatings] = useState<{ [key: string]: number }>({});
  const [comments, setComments] = useState<{ [key: string]: string }>({});

  // Obtener eventos calificables
  const { data: events, isLoading, error } = useQuery({
    queryKey: ['rateable-events'],
    queryFn: async () => {
      const response = await getRateableEventsRequest();
      return response.data;
    },
  });

  // Mutación para crear reseña
  const createReviewMutation = useMutation({
    mutationFn: (data: { evento_id: number; puntuacion?: number; comentario?: string }) => {
      return createReviewRequest(data);
    },
    onSuccess: (data, variables) => {
      toast.success("¡Gracias por tu reseña!");
      // Limpiar formulario
      setRatings(prev => {
        const newRatings = { ...prev };
        delete newRatings[variables.evento_id.toString()];
        return newRatings;
      });
      setComments(prev => {
        const newComments = { ...prev };
        delete newComments[variables.evento_id.toString()];
        return newComments;
      });
      // Invalidar query para recargar lista
      queryClient.invalidateQueries({ queryKey: ['rateable-events'] });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.evento?.[0] ||
                          'Error al enviar la reseña';
      toast.error(errorMessage);
    },
  });

  const handleStarClick = (eventId: number, rating: number) => {
    setRatings((prev) => ({ ...prev, [eventId.toString()]: rating }));
  };

  const handleCommentChange = (eventId: number, comment: string) => {
    setComments((prev) => ({ ...prev, [eventId.toString()]: comment }));
  };

  const handleSubmit = (eventId: number) => {
    const rating = ratings[eventId.toString()];
    const comment = comments[eventId.toString()]?.trim() || '';

    if (!rating && !comment) {
      toast.error("Por favor proporciona al menos una calificación o un comentario");
      return;
    }

    createReviewMutation.mutate({
      evento_id: eventId,
      puntuacion: rating || undefined,
      comentario: comment || undefined,
    });
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "d 'de' MMMM, yyyy", { locale: es });
  };

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), "HH:mm");
  };

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

        <div className="max-w-3xl space-y-6">
          {events && events.length > 0 ? (
            events.map((event: RateableEvent) => (
              <Card key={event.id} className="shadow-card">
                <CardHeader>
                  <CardTitle className="text-xl mb-2">{event.titulo}</CardTitle>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span>{formatDate(event.fecha_fin)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span>{event.ubicacion}</span>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground block">
                      Califica este evento
                    </label>
                    <p className="text-xs text-muted-foreground mb-3">
                      Selecciona de 1 a 5 estrellas según tu experiencia
                    </p>
                    <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg border border-border">
                      <StarRating
                        rating={ratings[event.id.toString()] || 0}
                        onRatingChange={(rating) => handleStarClick(event.id, rating)}
                        size="lg"
                        showLabel={true}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-foreground mb-2 block">
                      Cuéntanos sobre tu experiencia
                    </label>
                    <p className="text-xs text-muted-foreground mb-3">
                      Comparte tus comentarios sobre el evento (opcional)
                    </p>
                    <Textarea
                      placeholder="Comparte tus comentarios sobre el evento..."
                      rows={4}
                      className="resize-none"
                      value={comments[event.id.toString()] || ''}
                      onChange={(e) => handleCommentChange(event.id, e.target.value)}
                    />
                  </div>

                  <Button
                    onClick={() => handleSubmit(event.id)}
                    disabled={createReviewMutation.isPending}
                    className="w-full gradient-primary text-white border-0"
                  >
                    {createReviewMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      "Enviar reseña"
                    )}
                  </Button>
                </CardContent>
              </Card>
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