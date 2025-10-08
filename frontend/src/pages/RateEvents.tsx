import Sidebar from "@/components/layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Calendar, MapPin } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const RateEvents = () => {
  const [ratings, setRatings] = useState<{ [key: string]: number }>({});

  const pastEvents = [
    {
      id: "5",
      title: "Fiesta de Bienvenida",
      date: "2025-03-10",
      location: "Plaza Central",
    },
    {
      id: "6",
      title: "Conferencia de Tecnología",
      date: "2025-03-05",
      location: "Auditorio B",
    },
  ];

  const handleStarClick = (eventId: string, rating: number) => {
    setRatings((prev) => ({ ...prev, [eventId]: rating }));
  };

  const handleSubmit = (eventId: string) => {
    if (!ratings[eventId]) {
      toast.error("Por favor selecciona una calificación");
      return;
    }
    toast.success("¡Gracias por tu reseña!");
  };

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
          {pastEvents.map((event) => (
            <Card key={event.id} className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{event.title}</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleStarClick(event.id, star)}
                        className="focus:outline-none transition-base hover:scale-110"
                      >
                        <Star
                          className={`h-6 w-6 ${
                            ratings[event.id] >= star
                              ? "fill-amber-500 text-amber-500"
                              : "text-muted-foreground hover:text-amber-300"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>{event.location}</span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Cuéntanos sobre tu experiencia
                  </label>
                  <Textarea
                    placeholder="Comparte tus comentarios sobre el evento..."
                    rows={4}
                    className="resize-none"
                  />
                </div>

                <Button
                  onClick={() => handleSubmit(event.id)}
                  className="w-full gradient-primary text-white border-0"
                >
                  Enviar reseña
                </Button>
              </CardContent>
            </Card>
          ))}

          {pastEvents.length === 0 && (
            <Card className="shadow-card">
              <CardContent className="p-12 text-center">
                <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No tienes eventos para calificar
                </h3>
                <p className="text-muted-foreground">
                  Los eventos aparecerán aquí después de que finalicen
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
