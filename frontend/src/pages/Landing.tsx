import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Sparkles, ArrowRight, Bell, MessageSquare, Star as StarIcon, Search, Zap, Target, TrendingUp } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import EventCard from "@/components/events/EventCard";
import { mockEvents } from "@/data/mockEvents";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { AnimatedCounter } from "@/components/animations/AnimatedCounter";
import { AnimatedTitle } from "@/components/animations/AnimatedTitle";
import { StaggeredCards } from "@/components/animations/StaggeredCards";
import heroImage from "@/assets/hero-image.jpg";
import studentsCollaboration from "@/assets/students-collaboration.jpg";
import campusEvent from "@/assets/campus-event.jpg";

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
  const featuredEvents = mockEvents.slice(0, 3);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden gradient-hero min-h-[700px] flex items-center">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
        </div>
        
        <div className="container py-20 md:py-28 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-slide-in-left">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white shadow-soft animate-bounce-in">
                <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                <span className="text-sm font-bold bg-gradient-primary bg-clip-text text-transparent">
                  #1 Plataforma Universitaria
                </span>
              </div>
              
              <AnimatedTitle 
                text="Descubre los mejores eventos universitarios"
                className="text-5xl md:text-6xl font-extrabold leading-tight bg-gradient-accent bg-clip-text text-transparent"
              />
              
              <p className="text-xl md:text-2xl text-foreground/80 leading-relaxed font-medium">
                Únete, crea y disfruta de experiencias increíbles en tu campus
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button 
                  size="lg" 
                  asChild 
                  className="gradient-primary text-white text-lg px-8 py-6 border-0 hover-glow hover:scale-105 transition-bounce shadow-soft"
                >
                  <Link to="/eventos">
                    <Search className="mr-2 h-5 w-5" />
                    Explorar Eventos
                  </Link>
                </Button>
                
                <Button 
                  size="lg" 
                  variant="outline" 
                  asChild
                  className="text-lg px-8 py-6 border-2 border-primary bg-white text-primary hover:bg-primary hover:text-white transition-bounce"
                >
                  <Link to="/calendario">
                    <Calendar className="mr-2 h-5 w-5" />
                    Ver Calendario
                  </Link>
                </Button>
              </div>
              
              <div className="flex gap-8 pt-6">
                <div className="space-y-1 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                  <div className="flex items-center gap-2">
                    <AnimatedCounter 
                      end={500}
                      suffix="+"
                      className="text-4xl md:text-5xl font-extrabold bg-gradient-primary bg-clip-text text-transparent"
                    />
                    <TrendingUp className="h-6 w-6 text-accent" />
                  </div>
                  <div className="text-sm font-medium text-foreground/70">Eventos creados</div>
                </div>
                <div className="space-y-1 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                  <div className="flex items-center gap-2">
                    <AnimatedCounter 
                      end={2000}
                      suffix="+"
                      className="text-4xl md:text-5xl font-extrabold bg-gradient-secondary bg-clip-text text-transparent"
                    />
                    <StarIcon className="h-6 w-6 text-accent animate-pulse" />
                  </div>
                  <div className="text-sm font-medium text-foreground/70">Estudiantes activos</div>
                </div>
              </div>
            </div>
            
            <div className="relative animate-slide-in-right">
              <div className="absolute -inset-8 gradient-primary opacity-30 blur-3xl rounded-full animate-pulse" />
              <div className="relative rounded-3xl overflow-hidden shadow-glow border-4 border-white hover-lift">
                <img
                  src={heroImage}
                  alt="Estudiantes en eventos universitarios"
                  className="w-full animate-scale-in"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-background">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-6">
            <ScrollRevealSection direction="scale">
              <div className="relative overflow-hidden rounded-3xl p-10 text-center hover-lift gradient-primary">
                <Calendar className="h-16 w-16 mx-auto mb-4 text-white animate-float" />
                <AnimatedCounter 
                  end={48}
                  className="text-5xl font-extrabold text-white mb-2"
                />
                <div className="text-lg text-white/90 font-medium">Eventos próximos</div>
              </div>
            </ScrollRevealSection>
            
            <ScrollRevealSection direction="scale">
              <div className="relative overflow-hidden rounded-3xl p-10 text-center hover-lift" style={{ background: 'linear-gradient(135deg, hsl(260 75% 60%) 0%, hsl(270 70% 65%) 100%)' }}>
                <Users className="h-16 w-16 mx-auto mb-4 text-white animate-float" style={{ animationDelay: '0.5s' }} />
                <AnimatedCounter 
                  end={576}
                  suffix="+"
                  className="text-5xl font-extrabold text-white mb-2"
                />
                <div className="text-lg text-white/90 font-medium">Estudiantes participando</div>
              </div>
            </ScrollRevealSection>
            
            <ScrollRevealSection direction="scale">
              <div className="relative overflow-hidden rounded-3xl p-10 text-center hover-lift" style={{ background: 'linear-gradient(135deg, hsl(160 75% 50%) 0%, hsl(170 70% 55%) 100%)' }}>
                <Zap className="h-16 w-16 mx-auto mb-4 text-white animate-float" style={{ animationDelay: '1s' }} />
                <AnimatedCounter 
                  end={6}
                  className="text-5xl font-extrabold text-white mb-2"
                  duration={1500}
                />
                <div className="text-lg text-white/90 font-medium">Categorías disponibles</div>
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
            {featuredEvents.map((event) => (
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
            ))}
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

      {/* Testimonial Section with Image */}
      <section className="py-24 bg-background relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-primary" />
        </div>
        
        <div className="container relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <ScrollRevealSection direction="left">
              <div className="space-y-8">
                <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10">
                  <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                  <span className="text-sm font-bold text-primary">Vive la Experiencia</span>
                </div>
                
                <blockquote className="text-3xl md:text-4xl font-bold leading-relaxed text-foreground">
                  "La vida universitaria no se trata solo de estudiar,{" "}
                  <span className="bg-gradient-primary bg-clip-text text-transparent">
                    se trata de crear conexiones
                  </span>
                  , vivir experiencias y construir recuerdos inolvidables."
                </blockquote>
                
                <div className="flex gap-4 pt-4">
                  <Button size="lg" asChild className="gradient-primary text-white border-0 hover-glow">
                    <Link to="/eventos">Explorar eventos</Link>
                  </Button>
                </div>
              </div>
            </ScrollRevealSection>
            
            <ScrollRevealSection direction="right">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-accent opacity-20 blur-2xl rounded-3xl" />
                <div className="relative rounded-3xl overflow-hidden shadow-glow border-4 border-primary/20">
                  <img 
                    src={campusEvent} 
                    alt="Evento en el campus universitario" 
                    className="w-full h-[400px] object-cover"
                  />
                </div>
              </div>
            </ScrollRevealSection>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden gradient-hero">
        <div className="absolute top-10 left-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-20 w-80 h-80 bg-secondary/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        
        <div className="container relative z-10">
          <ScrollRevealSection direction="scale">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full gradient-primary shadow-glow">
                <Sparkles className="h-5 w-5 text-white animate-pulse" />
                <span className="text-sm font-bold text-white">¡Únete ahora!</span>
              </div>
              
              <h2 className="text-5xl md:text-6xl font-extrabold leading-tight text-foreground">
                ¿Listo para vivir{" "}
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  la mejor experiencia
                </span>
                ?
              </h2>
              
              <p className="text-2xl text-foreground/70 font-medium max-w-2xl mx-auto">
                Únete a cientos de estudiantes que ya están disfrutando de la vida universitaria al máximo.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button 
                  size="lg" 
                  asChild 
                  className="gradient-primary text-white text-xl px-12 py-7 border-0 hover-glow hover:scale-105 transition-bounce shadow-soft"
                >
                  <Link to="/dashboard">
                    Comienza gratis hoy
                    <ArrowRight className="ml-2 h-6 w-6" />
                  </Link>
                </Button>
                
                <Button 
                  size="lg" 
                  variant="outline" 
                  asChild
                  className="text-xl px-12 py-7 border-2 border-primary bg-white text-primary hover:bg-primary hover:text-white transition-bounce"
                >
                  <Link to="/eventos">Explorar eventos</Link>
                </Button>
              </div>
              
              <p className="text-sm text-foreground/60">
                ✨ Sin costo • Sin tarjeta de crédito • Acceso inmediato
              </p>
            </div>
          </ScrollRevealSection>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Landing;
