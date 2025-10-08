import Sidebar from "@/components/layout/Sidebar";
import { Input } from "@/components/ui/input";
import { Search, Calendar, Clock, TrendingUp, Sparkles } from "lucide-react";
import EventCard from "@/components/events/EventCard";
import { mockEvents } from "@/data/mockEvents";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const upcomingEvents = mockEvents.slice(0, 4);
  const pastEvents = mockEvents.slice(4, 6);

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      
      <main className="flex-1 p-8 bg-gradient-to-br from-background via-primary/5 to-secondary/5">
        {/* Welcome Section - Super Atractivo */}
        <div className="mb-8 relative">
          <div className="absolute -top-4 -left-4 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute top-0 right-0 w-40 h-40 bg-secondary/10 rounded-full blur-3xl" />
          
          <div className="relative bg-white rounded-3xl p-8 shadow-soft border-2 border-primary/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-12 w-12 rounded-2xl gradient-primary flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-primary bg-clip-text text-transparent">
                  ¡Bienvenido de nuevo!
                </h1>
                <p className="text-muted-foreground font-medium">Aquí están tus próximos eventos</p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-6 mt-6 pt-6 border-t border-primary/10">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">{upcomingEvents.length}</div>
                  <div className="text-xs text-muted-foreground font-medium">Próximos eventos</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl gradient-secondary flex items-center justify-center">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-secondary">{pastEvents.length}</div>
                  <div className="text-xs text-muted-foreground font-medium">Asistidos</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl gradient-accent flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-accent">+{upcomingEvents.length + pastEvents.length}</div>
                  <div className="text-xs text-muted-foreground font-medium">Total participación</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar - Mejorado */}
        <div className="mb-8 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary z-10" />
          <Input
            placeholder="Buscar eventos por nombre..."
            className="pl-12 h-14 rounded-2xl border-2 border-primary/20 focus:border-primary shadow-card bg-white text-base"
          />
        </div>

        {/* Upcoming Events - Más Colorido */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold">Eventos Próximos Inscritos</h2>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="hover-lift">
                <EventCard
                  id={event.id}
                  title={event.title}
                  category={event.category}
                  date={event.dateStart}
                  time={event.time}
                  location={event.location}
                  capacity={event.capacity}
                  registered={event.registered}
                  image={event.image}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Past Events - Más Llamativo */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl gradient-secondary flex items-center justify-center">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold">Eventos Asistidos</h2>
            </div>
            
            <Button 
              asChild 
              className="gradient-accent text-white border-0 hover-glow hover:scale-105 transition-bounce"
            >
              <Link to="/dashboard/rate">
                <Sparkles className="mr-2 h-4 w-4" />
                Calificar eventos
              </Link>
            </Button>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pastEvents.map((event) => (
              <div key={event.id} className="relative hover-lift">
                <EventCard
                  id={event.id}
                  title={event.title}
                  category={event.category}
                  date={event.dateStart}
                  time={event.time}
                  location={event.location}
                  capacity={event.capacity}
                  registered={event.registered}
                  image={event.image}
                />
                <div className="absolute top-2 right-2 px-3 py-1 rounded-full bg-secondary/90 text-white text-xs font-bold shadow-soft">
                  Finalizado
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
