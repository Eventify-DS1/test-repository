import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Sparkles, ArrowRight, Bell, MessageSquare, Star as StarIcon, Search, Zap, Target, TrendingUp, Music, Moon, Drama, Plane, Heart, Gamepad2, Briefcase, UtensilsCrossed } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import EventCard from "@/components/events/EventCard";
import { mockEvents } from "@/data/mockEvents";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { AnimatedCounter, AnimatedTitle, StaggeredCards } from "@/components/animations";
import heroImage from "@/assets/hero-image.jpg";
import studentsCollaboration from "@/assets/students-collaboration.jpg";
import { useEffect, useState } from "react";
import { getUsersCountRequest } from "@/api/users";
import { getFeaturedEventsRequest } from "@/api/events";

// Tipo para eventos del backend
interface BackendEvento {
  id: number;
  titulo: string;
  categoria?: { nombre: string };
  fecha_inicio: string;
  ubicacion: string;
  aforo: number;
  inscritos?: number;
  imagen?: string;
}

const ScrollRevealSection = ({ children, className = "", direction = "up" }: { 
  children: React.ReactNode; 
  className?: string;
  direction?: "up" | "left" | "right" | "scale";
}) => {
  const { ref, isRevealed } = useScrollReveal();
  
  const getAnimationClass = () => {
    switch(direction) {
      case "left": return "scroll-reveal-left";
      case "right": return "scroll-reveal-right";
      case "scale": return "scroll-reveal-scale";
      default: return "scroll-reveal";
    }
  };
  
  return (
    <div 
      ref={ref} 
      className={`${getAnimationClass()} ${isRevealed ? 'revealed' : ''} ${className}`}
    >
      {children}
    </div>
  );
};

const Landing = () => {
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [loadingFeaturedEvents, setLoadingFeaturedEvents] = useState(true);
  const [usuariosRegistrados, setUsuariosRegistrados] = useState(0);
  const [totalEvents, setTotalEvents] = useState(0);
  useEffect(() => {
    const fetchUsersCount = async () => {
      try {
        const response = await getUsersCountRequest();
        setUsuariosRegistrados(response.data.total);
      } catch (error) {
        console.error('Error al obtener el contador de usuarios:', error);
      }
    };
  fetchUsersCount();
  }, []);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoadingFeaturedEvents(true);
        const response = await getFeaturedEventsRequest(3);
        
        console.log('✅ Eventos recibidos:', response.data);
        
        // La respuesta puede venir como { results: [...], count: N } o directamente [...]
        const eventosData = response.data.results || response.data || [];
        
        // Actualizar contador total si viene en la respuesta
        if (response.data.count) {
          setTotalEvents(response.data.count);
        }
        
        // Mapear datos del backend al formato del frontend
        const mappedEvents = eventosData.map((evento: BackendEvento) => ({
          id: evento.id,
          title: evento.titulo,
          category: evento.categoria?.nombre || 'Sin categoría',
          dateStart: evento.fecha_inicio,
          time: new Date(evento.fecha_inicio).toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          location: evento.ubicacion,
          capacity: evento.aforo,
          registered: evento.inscritos || 0,
          image: evento.imagen || '/placeholder.svg'
        }));
        
        setFeaturedEvents(mappedEvents);
        console.log('✅ Eventos mapeados:', mappedEvents);
        
      } catch (error) {
        console.error('❌ Error al obtener eventos:', error);
        // Fallback a mockEvents si falla la API
        setFeaturedEvents(mockEvents.slice(0, 3));
      } finally {
        setLoadingFeaturedEvents(false);
      }
    };
    
    fetchEvents();
  }, []);


  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      {/* Hero Section - Full Screen Invasive */}
      <section className="relative min-h-screen w-full overflow-hidden flex items-center py-20">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Eventos Universitarios"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80" />
        </div>
        
        {/* Content Centered */}
        <div className="relative z-10 w-full flex flex-col items-center justify-center text-center px-4 py-16">
          <div className="max-w-5xl space-y-6 animate-fade-in">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 animate-bounce-in">
              <Sparkles className="h-4 w-4 text-white animate-pulse" />
              <span className="text-xs font-bold text-white">
                #1 PLATAFORMA UNIVERSITARIA
              </span>
            </div>
            
            {/* Main Title */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white leading-none tracking-tight drop-shadow-2xl animate-slide-in-left">
              VIVE LA
              <br />
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                EXPERIENCIA
              </span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-lg md:text-2xl text-white/90 font-medium max-w-3xl mx-auto leading-relaxed drop-shadow-lg animate-slide-in-right">
              Descubre, crea y participa en los mejores eventos de tu campus.
              <br className="hidden md:block" />
              Tu comunidad universitaria te espera.
            </p>
            
            {/* CTA Button */}
            <div className="pt-4 animate-bounce-in" style={{ animationDelay: '0.3s' }}>
              <Button 
                size="lg" 
                asChild 
                className="gradient-primary text-white text-lg px-12 py-6 h-auto border-0 hover-glow hover:scale-110 transition-all duration-300 shadow-2xl font-bold"
              >
                <Link to="/eventos">
                  EXPLORAR EVENTOS
                  <ArrowRight className="ml-2 h-6 w-6" />
                </Link>
              </Button>
            </div>
            
            {/* Stats */}
            <div className="flex flex-wrap gap-8 md:gap-16 justify-center pt-8 pb-8 animate-fade-in" style={{ animationDelay: '0.5s' }}>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <AnimatedCounter 
                    end={totalEvents}
                    suffix="+"
                    className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-lg"
                  />
                  <TrendingUp className="h-6 w-6 md:h-7 md:w-7 text-accent" />
                </div>
                <div className="text-white/80 font-medium text-base md:text-lg">Eventos</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <AnimatedCounter 
                    end={usuariosRegistrados}
                    suffix="+"
                    className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-lg"
                  />
                  <StarIcon className="h-6 w-6 md:h-7 md:w-7 text-accent" />
                </div>
                <div className="text-white/80 font-medium text-base md:text-lg">Estudiantes</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-5 h-9 border-2 border-white/40 rounded-full flex justify-center">
            <div className="w-1 h-2 bg-white/60 rounded-full mt-2 animate-pulse" />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-background">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <ScrollRevealSection direction="scale">
              <div className="relative overflow-hidden rounded-3xl p-10 text-center hover-lift gradient-primary shadow-xl">
                <Calendar className="h-14 w-14 mx-auto mb-4 text-white animate-float" />
                <AnimatedCounter 
                  end={totalEvents}
                  className="text-5xl font-extrabold text-white mb-2"
                />
                <div className="text-lg text-white/90 font-medium">Eventos próximos</div>
              </div>
            </ScrollRevealSection>
            
            <ScrollRevealSection direction="scale">
              <div className="relative overflow-hidden rounded-3xl p-10 text-center hover-lift shadow-xl" style={{ background: 'linear-gradient(135deg, hsl(260 75% 60%) 0%, hsl(270 70% 65%) 100%)' }}>
                <Users className="h-14 w-14 mx-auto mb-4 text-white animate-float" style={{ animationDelay: '0.5s' }} />
                <AnimatedCounter 
                  end={usuariosRegistrados}
                  suffix="+"
                  className="text-5xl font-extrabold text-white mb-2"
                />
                <div className="text-lg text-white/90 font-medium">Estudiantes participando</div>
              </div>
            </ScrollRevealSection>
            
            <ScrollRevealSection direction="scale">
              <div className="relative overflow-hidden rounded-3xl p-10 text-center hover-lift shadow-xl" style={{ background: 'linear-gradient(135deg, hsl(160 75% 50%) 0%, hsl(170 70% 55%) 100%)' }}>
                <Zap className="h-14 w-14 mx-auto mb-4 text-white animate-float" style={{ animationDelay: '1s' }} />
                <AnimatedCounter 
                  end={6}
                  className="text-5xl font-extrabold text-white mb-2"
                  duration={1500}
                />
                <div className="text-lg text-white/90 font-medium">Categorías disponibles</div>
              </div>
            </ScrollRevealSection>
          </div>

          {/* Categories Section */}
          <ScrollRevealSection>
            <div className="text-center mb-10">
              <h3 className="text-2xl md:text-3xl font-extrabold text-foreground mb-2">
                Explora por{" "}
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  Categoría
                </span>
              </h3>
              <p className="text-base text-foreground/70">Encuentra eventos que se adapten a tus intereses</p>
            </div>
          </ScrollRevealSection>

          <div className="flex flex-wrap justify-center gap-6 md:gap-10">
            <ScrollRevealSection direction="scale">
              <div className="flex flex-col items-center group cursor-pointer">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-2 group-hover:scale-110 group-hover:shadow-xl transition-all duration-300 border-2 border-primary/20 group-hover:border-primary">
                  <Music className="h-8 w-8 text-primary" />
                </div>
                <span className="text-xs font-semibold text-foreground/80 group-hover:text-primary transition-colors">Música</span>
              </div>
            </ScrollRevealSection>

            <ScrollRevealSection direction="scale">
              <div className="flex flex-col items-center group cursor-pointer">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-secondary/20 to-secondary/10 flex items-center justify-center mb-2 group-hover:scale-110 group-hover:shadow-xl transition-all duration-300 border-2 border-secondary/20 group-hover:border-secondary">
                  <Moon className="h-8 w-8 text-secondary" />
                </div>
                <span className="text-xs font-semibold text-foreground/80 group-hover:text-secondary transition-colors">Vida nocturna</span>
              </div>
            </ScrollRevealSection>

            <ScrollRevealSection direction="scale">
              <div className="flex flex-col items-center group cursor-pointer">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center mb-2 group-hover:scale-110 group-hover:shadow-xl transition-all duration-300 border-2 border-accent/20 group-hover:border-accent">
                  <Drama className="h-8 w-8 text-accent" />
                </div>
                <span className="text-xs font-semibold text-foreground/80 group-hover:text-accent transition-colors">Artes escénicas</span>
              </div>
            </ScrollRevealSection>

            <ScrollRevealSection direction="scale">
              <div className="flex flex-col items-center group cursor-pointer">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-2 group-hover:scale-110 group-hover:shadow-xl transition-all duration-300 border-2 border-primary/20 group-hover:border-primary">
                  <Plane className="h-8 w-8 text-primary" />
                </div>
                <span className="text-xs font-semibold text-foreground/80 group-hover:text-primary transition-colors">Vacaciones</span>
              </div>
            </ScrollRevealSection>

            <ScrollRevealSection direction="scale">
              <div className="flex flex-col items-center group cursor-pointer">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-secondary/20 to-secondary/10 flex items-center justify-center mb-2 group-hover:scale-110 group-hover:shadow-xl transition-all duration-300 border-2 border-secondary/20 group-hover:border-secondary">
                  <Heart className="h-8 w-8 text-secondary" />
                </div>
                <span className="text-xs font-semibold text-foreground/80 group-hover:text-secondary transition-colors">Citas</span>
              </div>
            </ScrollRevealSection>

            <ScrollRevealSection direction="scale">
              <div className="flex flex-col items-center group cursor-pointer">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center mb-2 group-hover:scale-110 group-hover:shadow-xl transition-all duration-300 border-2 border-accent/20 group-hover:border-accent">
                  <Gamepad2 className="h-8 w-8 text-accent" />
                </div>
                <span className="text-xs font-semibold text-foreground/80 group-hover:text-accent transition-colors">Aficiones</span>
              </div>
            </ScrollRevealSection>

            <ScrollRevealSection direction="scale">
              <div className="flex flex-col items-center group cursor-pointer">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-2 group-hover:scale-110 group-hover:shadow-xl transition-all duration-300 border-2 border-primary/20 group-hover:border-primary">
                  <Briefcase className="h-8 w-8 text-primary" />
                </div>
                <span className="text-xs font-semibold text-foreground/80 group-hover:text-primary transition-colors">Negocios</span>
              </div>
            </ScrollRevealSection>

            <ScrollRevealSection direction="scale">
              <div className="flex flex-col items-center group cursor-pointer">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-secondary/20 to-secondary/10 flex items-center justify-center mb-2 group-hover:scale-110 group-hover:shadow-xl transition-all duration-300 border-2 border-secondary/20 group-hover:border-secondary">
                  <UtensilsCrossed className="h-8 w-8 text-secondary" />
                </div>
                <span className="text-xs font-semibold text-foreground/80 group-hover:text-secondary transition-colors">Gastronomía</span>
              </div>
            </ScrollRevealSection>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 gradient-hero relative overflow-hidden">
        <div className="container">
          <ScrollRevealSection>
            <div className="text-center mb-16 space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-soft">
                <Sparkles className="h-5 w-5 text-primary" />
                <span className="text-sm font-bold text-primary">¿Por qué Eventify?</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-foreground">
                Características{" "}
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  principales
                </span>
              </h2>
              <p className="text-xl text-foreground/70 max-w-2xl mx-auto">
                Todo lo que necesitas para vivir tu experiencia universitaria al máximo
              </p>
            </div>
          </ScrollRevealSection>
          
          <StaggeredCards className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="group bg-white p-8 rounded-3xl hover-lift border-2 border-primary/10 hover:border-primary/30 transition-base">
              <div className="h-14 w-14 rounded-2xl gradient-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-bounce">
                <Calendar className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground">Crear y publicar eventos</h3>
              <p className="text-foreground/70 leading-relaxed">
                Organiza tus eventos de forma fácil y compártelos con toda la comunidad universitaria.
              </p>
            </div>
            
            <div className="group bg-white p-8 rounded-3xl hover-lift border-2 border-secondary/10 hover:border-secondary/30 transition-base">
              <div className="h-14 w-14 rounded-2xl gradient-secondary flex items-center justify-center mb-6 group-hover:scale-110 transition-bounce">
                <Search className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground">Descubrir actividades</h3>
              <p className="text-foreground/70 leading-relaxed">
                Encuentra eventos académicos, deportivos, culturales y sociales que te interesen.
              </p>
            </div>
            
            <div className="group bg-white p-8 rounded-3xl hover-lift border-2 border-accent/10 hover:border-accent/30 transition-base">
              <div className="h-14 w-14 rounded-2xl gradient-accent flex items-center justify-center mb-6 group-hover:scale-110 transition-bounce">
                <Users className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground">Ver quién asiste</h3>
              <p className="text-foreground/70 leading-relaxed">
                Conoce quiénes participarán y conecta con estudiantes que comparten tus intereses.
              </p>
            </div>
            
            <div className="group bg-white p-8 rounded-3xl hover-lift border-2 border-primary/10 hover:border-primary/30 transition-base">
              <div className="h-14 w-14 rounded-2xl gradient-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-bounce">
                <Bell className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground">Notificaciones</h3>
              <p className="text-foreground/70 leading-relaxed">
                Recibe recordatorios automáticos y mantente al día con tus eventos favoritos.
              </p>
            </div>
            
            <div className="group bg-white p-8 rounded-3xl hover-lift border-2 border-secondary/10 hover:border-secondary/30 transition-base">
              <div className="h-14 w-14 rounded-2xl gradient-secondary flex items-center justify-center mb-6 group-hover:scale-110 transition-bounce">
                <MessageSquare className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground">Comentar y calificar</h3>
              <p className="text-foreground/70 leading-relaxed">
                Comparte tu experiencia y ayuda a otros a elegir los mejores eventos.
              </p>
            </div>
            
            <div className="group bg-white p-8 rounded-3xl hover-lift border-2 border-accent/10 hover:border-accent/30 transition-base">
              <div className="h-14 w-14 rounded-2xl gradient-accent flex items-center justify-center mb-6 group-hover:scale-110 transition-bounce">
                <Target className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground">Gestión fácil</h3>
              <p className="text-foreground/70 leading-relaxed">
                Sistema intuitivo con reportes detallados y herramientas de organización.
              </p>
            </div>
          </StaggeredCards>
        </div>
      </section>

      {/* Featured Events Section */}
      <section id="eventos" className="py-24 bg-background">
        <div className="container">
          <ScrollRevealSection>
            <div className="flex justify-between items-center mb-12">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 mb-4">
                  <Zap className="h-5 w-5 text-primary" />
                  <span className="text-sm font-bold text-primary">Eventos Destacados</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-extrabold mb-3 text-foreground">
                  Los más{" "}
                  <span className="bg-gradient-primary bg-clip-text text-transparent">
                    populares
                  </span>
                </h2>
                <p className="text-xl text-foreground/70">No te pierdas estos increíbles eventos</p>
              </div>
              
              <Button 
                variant="outline" 
                asChild
                className="border-2 border-primary text-primary hover:bg-primary hover:text-white transition-bounce hidden md:inline-flex"
              >
                <Link to="/eventos">Ver todos</Link>
              </Button>
            </div>
          </ScrollRevealSection>
          
          <div className="grid md:grid-cols-3 gap-8">
  {loadingFeaturedEvents ? (
    // Skeleton loader mientras carga
    [1, 2, 3].map((i) => (
      <div key={i} className="animate-pulse">
        <div className="bg-gray-200 dark:bg-gray-700 h-80 rounded-3xl"></div>
      </div>
    ))
  ) : featuredEvents.length > 0 ? (
    // Mostrar eventos reales
    featuredEvents.map((event) => (
      <ScrollRevealSection key={event.id} direction="scale">
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
      </ScrollRevealSection>
    ))
  ) : (
    // Si no hay eventos
    <div className="col-span-3 text-center py-12">
      <p className="text-xl text-muted-foreground">
        No hay eventos disponibles en este momento 📅
      </p>
      <p className="text-sm text-muted-foreground mt-2">
        Pronto habrá nuevos eventos increíbles
      </p>
    </div>
  )}
</div>
          
          <div className="text-center mt-12">
            <Button 
              size="lg"
              variant="outline" 
              asChild
              className="border-2 border-primary text-primary hover:bg-primary hover:text-white transition-bounce md:hidden"
            >
              <Link to="/eventos">Ver todos los eventos</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Image Section with CTA */}
      <section className="py-24 gradient-hero">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <ScrollRevealSection direction="left">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-primary opacity-20 blur-2xl rounded-3xl" />
                <div className="relative rounded-3xl overflow-hidden shadow-glow border-4 border-white">
                  <img 
                    src={studentsCollaboration} 
                    alt="Estudiantes colaborando en el campus" 
                    className="w-full h-[400px] object-cover"
                  />
                </div>
              </div>
            </ScrollRevealSection>
            
            <ScrollRevealSection direction="right">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-soft">
                  <Users className="h-5 w-5 text-secondary" />
                  <span className="text-sm font-bold text-secondary">Comunidad Activa</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-extrabold text-foreground">
                  Conecta con{" "}
                  <span className="bg-gradient-secondary bg-clip-text text-transparent">
                    tu comunidad
                  </span>
                </h2>
                <p className="text-xl text-foreground/70 leading-relaxed">
                  Únete a una comunidad vibrante de estudiantes apasionados. Colabora en proyectos, 
                  participa en actividades y crea conexiones que durarán toda la vida.
                </p>
                <Button 
                  size="lg" 
                  asChild
                  className="gradient-secondary text-white border-0 hover-glow"
                >
                  <Link to="/eventos">Descubre más</Link>
                </Button>
              </div>
            </ScrollRevealSection>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Landing;
