import { useState } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockEvents } from "@/data/mockEvents";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const Calendario = () => {
  const [selectedEvent, setSelectedEvent] = useState<typeof mockEvents[0] | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "académico":
        return "bg-blue-500";
      case "deportivo":
        return "bg-green-500";
      case "cultural":
        return "bg-purple-500";
      case "social":
        return "bg-amber-500";
      default:
        return "bg-gray-500";
    }
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "académico":
        return "bg-blue-500/20 text-blue-700 hover:bg-blue-500/30";
      case "deportivo":
        return "bg-green-500/20 text-green-700 hover:bg-green-500/30";
      case "cultural":
        return "bg-purple-500/20 text-purple-700 hover:bg-purple-500/30";
      case "social":
        return "bg-amber-500/20 text-amber-700 hover:bg-amber-500/30";
      default:
        return "bg-gray-500/20 text-gray-700";
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const getEventsForDate = (day: number) => {
    const { year, month } = getDaysInMonth(currentDate);
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return mockEvents.filter((event) => event.dateStart === dateStr);
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleDateString("es-ES", { month: "long", year: "numeric" });

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-12 bg-gradient-hero">
        <div className="container">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-soft mb-4">
              <CalendarIcon className="h-5 w-5 text-primary" />
              <span className="text-sm font-bold text-primary">Calendario de Eventos</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-3">
              Planifica tu{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                semestre
              </span>
            </h1>
            <p className="text-xl text-foreground/70">
              Visualiza todos los eventos próximos del campus
            </p>
          </div>

          <Card className="shadow-soft border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl capitalize">{monthName}</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={previousMonth}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={nextMonth}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardDescription>
                Vista mensual de eventos universitarios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day) => (
                  <div
                    key={day}
                    className="text-center font-semibold text-sm text-muted-foreground py-2"
                  >
                    {day}
                  </div>
                ))}

                {Array.from({ length: startingDayOfWeek }).map((_, index) => (
                  <div key={`empty-${index}`} className="aspect-square" />
                ))}

                {Array.from({ length: daysInMonth }).map((_, index) => {
                  const day = index + 1;
                  const events = getEventsForDate(day);
                  const hasEvents = events.length > 0;

                  return (
                    <div
                      key={day}
                      className={`aspect-square border rounded-lg p-2 hover:border-primary transition-base ${
                        hasEvents ? "bg-primary/5 cursor-pointer" : "bg-background"
                      }`}
                    >
                      <div className="text-sm font-medium mb-1">{day}</div>
                      <div className="space-y-1">
                        {events.slice(0, 2).map((event) => (
                          <div
                            key={event.id}
                            onClick={() => setSelectedEvent(event)}
                            className={`${getCategoryColor(
                              event.category
                            )} h-1.5 rounded-full cursor-pointer hover:opacity-80 transition-base`}
                          />
                        ))}
                        {events.length > 2 && (
                          <div className="text-xs text-muted-foreground">
                            +{events.length - 2}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 flex flex-wrap gap-4 justify-center">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-blue-500" />
                  <span className="text-sm">Académico</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-green-500" />
                  <span className="text-sm">Deportivo</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-purple-500" />
                  <span className="text-sm">Cultural</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-amber-500" />
                  <span className="text-sm">Social</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Próximos eventos */}
          <div className="mt-12">
            <h2 className="text-3xl font-bold mb-6">Próximos eventos</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockEvents.slice(0, 6).map((event) => (
                <Card
                  key={event.id}
                  className="hover:shadow-soft transition-base cursor-pointer"
                  onClick={() => setSelectedEvent(event)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg line-clamp-2">{event.title}</CardTitle>
                      <Badge className={getCategoryBadgeColor(event.category)}>
                        {event.category}
                      </Badge>
                    </div>
                    <CardDescription>
                      {new Date(event.dateStart).toLocaleDateString("es-ES", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>⏰ {event.time}</p>
                      <p>📍 {event.location}</p>
                      <p>
                        👥 {event.registered}/{event.capacity} inscritos
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Event Detail Modal */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <DialogTitle className="text-2xl">{selectedEvent?.title}</DialogTitle>
              <Badge className={getCategoryBadgeColor(selectedEvent?.category || "")}>
                {selectedEvent?.category}
              </Badge>
            </div>
            <DialogDescription className="text-base">
              {selectedEvent?.description}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fecha</p>
                <p className="text-base">
                  {selectedEvent &&
                    new Date(selectedEvent.dateStart).toLocaleDateString("es-ES", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Hora</p>
                <p className="text-base">{selectedEvent?.time}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ubicación</p>
                <p className="text-base">{selectedEvent?.location}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Aforo</p>
                <p className="text-base">
                  {selectedEvent?.registered}/{selectedEvent?.capacity} inscritos
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Organizador</p>
              <p className="text-base">{selectedEvent?.organizer}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Calendario;
