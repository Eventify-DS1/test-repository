import Sidebar from "@/components/layout/Sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search as SearchIcon, Filter } from "lucide-react";
import EventCard from "@/components/events/EventCard";
import { mockEvents } from "@/data/mockEvents";

const Search = () => {
  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      
      <main className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Buscar Eventos</h1>
          <p className="text-muted-foreground">Encuentra el evento perfecto para ti</p>
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
              />
            </div>

            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                <SelectItem value="academico">Académico</SelectItem>
                <SelectItem value="deportivo">Deportivo</SelectItem>
                <SelectItem value="cultural">Cultural</SelectItem>
                <SelectItem value="social">Social</SelectItem>
              </SelectContent>
            </Select>

            <Input type="date" placeholder="Fecha" />

            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Ubicación" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las ubicaciones</SelectItem>
                <SelectItem value="auditorio">Auditorio Principal</SelectItem>
                <SelectItem value="cancha">Cancha de Fútbol</SelectItem>
                <SelectItem value="teatro">Teatro Universidad</SelectItem>
                <SelectItem value="laboratorio">Laboratorio</SelectItem>
                <SelectItem value="plaza">Plaza Central</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end mt-4">
            <Button className="gradient-primary text-white border-0">
              <SearchIcon className="mr-2 h-4 w-4" />
              Buscar
            </Button>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-6">
            <p className="text-muted-foreground">
              Mostrando {mockEvents.length} eventos
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

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockEvents.map((event) => (
              <EventCard
                key={event.id}
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
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Search;
