import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Clock, ArrowLeft, Star } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { mockEvents } from "@/data/mockEvents";
import eventPlaceholder from "@/assets/event-placeholder.jpg";

const EventDetail = () => {
  const { id } = useParams();
  const event = mockEvents.find((e) => e.id === id);

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Evento no encontrado</p>
      </div>
    );
  }

  const spotsLeft = event.capacity - event.registered;
  const averageRating = event.ratings
    ? event.ratings.reduce((acc, r) => acc + r.rating, 0) / event.ratings.length
    : 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="container py-12 flex-1">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a eventos
          </Link>
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="relative h-96 rounded-2xl overflow-hidden">
              <img
                src={event.image || eventPlaceholder}
                alt={event.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-4xl font-bold mb-3">{event.title}</h1>
                  <Badge className="bg-primary/20 text-primary text-sm">
                    {event.category}
                  </Badge>
                </div>
                {event.ratings && event.ratings.length > 0 && (
                  <div className="flex items-center gap-2 bg-muted px-4 py-2 rounded-xl">
                    <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
                    <span className="font-semibold">{averageRating.toFixed(1)}</span>
                    <span className="text-sm text-muted-foreground">
                      ({event.ratings.length} reseñas)
                    </span>
                  </div>
                )}
              </div>

              <p className="text-lg text-muted-foreground leading-relaxed">
                {event.description}
              </p>
            </div>

            {event.ratings && event.ratings.length > 0 && (
              <div className="border-t pt-6">
                <h2 className="text-2xl font-semibold mb-4">Reseñas</h2>
                <div className="space-y-4">
                  {event.ratings.map((rating, index) => (
                    <div key={index} className="bg-muted/50 p-4 rounded-xl">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-medium">{rating.user}</span>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < rating.rating
                                  ? "fill-amber-500 text-amber-500"
                                  : "text-muted-foreground"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{rating.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-card border rounded-2xl p-6 shadow-card sticky top-24 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha de inicio</p>
                    <p className="font-medium">{event.dateStart}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-secondary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha de finalización</p>
                    <p className="font-medium">{event.dateEnd}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Horario</p>
                    <p className="font-medium">{event.time}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-accent" />
                  <div>
                    <p className="text-sm text-muted-foreground">Ubicación</p>
                    <p className="font-medium">{event.location}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Asistentes confirmados</p>
                    <p className="font-medium">
                      {event.registered} / {event.capacity} personas
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="mb-3">
                  {spotsLeft > 0 ? (
                    <p className="text-sm text-primary font-medium">
                      ✓ {spotsLeft} cupos disponibles
                    </p>
                  ) : (
                    <p className="text-sm text-destructive font-medium">
                      ✗ Evento lleno
                    </p>
                  )}
                </div>

                <Button
                  disabled
                  className="w-full gradient-primary text-white border-0"
                >
                  Registrarse para asistir
                </Button>
                <p className="text-xs text-center text-muted-foreground mt-2">
                  Solo disponible para usuarios registrados
                </p>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Organizado por:</p>
                <p className="font-semibold">{event.organizer}</p>
              </div>

              {event.attendees.length > 0 && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-semibold mb-3">
                    Asistentes inscritos ({event.attendees.length})
                  </p>
                  <div className="space-y-2">
                    {event.attendees.map((attendee, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-base"
                      >
                        <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {attendee.charAt(0)}
                        </div>
                        <span className="text-sm font-medium">{attendee}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default EventDetail;
