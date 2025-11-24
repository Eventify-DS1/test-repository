import { useParams, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  createReviewRequest,
  getEventReviewsRequest
} from "@/api/reviews";
import { getEventByIdRequest } from "@/api/events";
import StarRating from "@/components/events/StarRating";

const RateEventForm = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  
  // Detectar si viene de "Calificar eventos" o "Buscar eventos"
  const fromRateEvents = location.state?.fromRateEvents || false;
  const fromSearch = location.state?.fromSearch || false;

  // Obtener detalles del evento
  const { data: event, isLoading: isLoadingEvent, error: eventError } = useQuery({
    queryKey: ['event-details', eventId],
    queryFn: async () => {
      if (!eventId) return null;
      const response = await getEventByIdRequest(parseInt(eventId));
      return response.data;
    },
    enabled: !!eventId,
  });

  // Mutación para crear reseña
  const createReviewMutation = useMutation({
    mutationFn: (data: { evento_id: number; puntuacion?: number; comentario?: string }) => {
      return createReviewRequest(data);
    },
    onSuccess: () => {
      toast.success("¡Gracias por tu reseña!");
      // Invalidar queries para recargar datos
      queryClient.invalidateQueries({ queryKey: ['rateable-events'] });
      queryClient.invalidateQueries({ queryKey: ['event-details'] });
      queryClient.invalidateQueries({ queryKey: ['event-reviews'] });
      // Navegar de vuelta según el origen
      if (fromSearch) {
        navigate("/dashboard/search");
      } else if (fromRateEvents) {
        navigate("/dashboard/rate");
      } else {
        navigate("/dashboard/rate");
      }
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.evento?.[0] ||
                          'Error al enviar la reseña';
      toast.error(errorMessage);
    },
  });

  const handleSubmit = () => {
    if (!eventId || !event) return;

    if (!rating && !comment.trim()) {
      toast.error("Por favor proporciona al menos una calificación o un comentario");
      return;
    }

    createReviewMutation.mutate({
      evento_id: parseInt(eventId),
      puntuacion: rating || undefined,
      comentario: comment.trim() || undefined,
    });
  };

  const handleCancel = () => {
    if (fromSearch) {
      navigate("/dashboard/search");
    } else if (fromRateEvents) {
      navigate("/dashboard/rate");
    } else {
      navigate("/dashboard/rate");
    }
  };
  
  let backText = "Volver a eventos";
  if (fromSearch) {
    backText = "Volver a buscar eventos";
  } else if (fromRateEvents) {
    backText = "Volver a calificar eventos";
  }

  if (isLoadingEvent) {
    return (
      <div className="flex min-h-screen w-full">
        <Sidebar />
        <main className="flex-1 p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  if (eventError || !event) {
    return (
      <div className="flex min-h-screen w-full">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="text-center">
            <p className="text-destructive mb-4">Error al cargar el evento</p>
            <Button onClick={handleCancel} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {backText}
            </Button>
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
            <Button
            variant="ghost"
            onClick={handleCancel}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {backText}
          </Button>
          <h1 className="text-3xl font-bold mb-2">Calificar Evento</h1>
          <p className="text-muted-foreground">
            {event.titulo}
          </p>
        </div>

        <div className="max-w-2xl">
          <Card className="shadow-card">
            <CardContent className="p-6 space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">Tu opinión es importante</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Comparte tu experiencia y ayuda a otros a conocer este evento
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground block">
                  Calificación
                </label>
                <p className="text-xs text-muted-foreground mb-3">
                  Selecciona de 1 a 5 estrellas según tu experiencia
                </p>
                <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg border border-border">
                  <StarRating
                    rating={rating}
                    onRatingChange={setRating}
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
                  rows={6}
                  className="resize-none"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSubmit}
                  disabled={createReviewMutation.isPending}
                  className="flex-1 gradient-primary text-white border-0"
                >
                  {createReviewMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Star className="mr-2 h-4 w-4" />
                      Enviar reseña
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={createReviewMutation.isPending}
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default RateEventForm;

