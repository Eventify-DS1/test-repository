import Sidebar from "@/components/layout/Sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Clock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Notifications = () => {
  const notifications = [
    {
      id: "1",
      eventId: "1",
      title: "Feria de Emprendimiento 2025",
      date: "2025-03-15",
      time: "14:00",
      location: "Auditorio Principal",
      daysUntil: 5,
      type: "próximo",
    },
    {
      id: "2",
      eventId: "2",
      title: "Torneo Relámpago de Fútbol",
      date: "2025-03-20",
      time: "09:00",
      location: "Cancha de Fútbol",
      daysUntil: 10,
      type: "próximo",
    },
    {
      id: "3",
      eventId: "3",
      title: "Noche de Teatro Universitario",
      date: "2025-03-25",
      time: "19:00",
      location: "Teatro Universidad",
      daysUntil: 15,
      type: "próximo",
    },
  ];

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      
      <main className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Notificaciones</h1>
          <p className="text-muted-foreground">
            Recordatorios de tus eventos próximos
          </p>
        </div>

        <div className="max-w-3xl space-y-4">
          {notifications.map((notification) => (
            <Card key={notification.id} className="shadow-card hover:shadow-soft transition-base">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge
                        variant="outline"
                        className={
                          notification.daysUntil <= 7
                            ? "bg-primary/10 text-primary border-primary"
                            : "bg-muted"
                        }
                      >
                        {notification.daysUntil === 0
                          ? "¡Hoy!"
                          : notification.daysUntil === 1
                          ? "Mañana"
                          : `En ${notification.daysUntil} días`}
                      </Badge>
                    </div>

                    <h3 className="text-xl font-semibold mb-3">
                      {notification.title}
                    </h3>

                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span>{notification.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        <span>{notification.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span>{notification.location}</span>
                      </div>
                    </div>
                  </div>

                  <Button asChild variant="outline" size="sm">
                    <Link to={`/event/${notification.eventId}`}>
                      Ver evento
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {notifications.length === 0 && (
            <Card className="shadow-card">
              <CardContent className="p-12 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No tienes notificaciones
                </h3>
                <p className="text-muted-foreground mb-4">
                  Inscríbete a eventos para recibir recordatorios
                </p>
                <Button asChild className="gradient-primary text-white border-0">
                  <Link to="/dashboard/search">Buscar eventos</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Notifications;
