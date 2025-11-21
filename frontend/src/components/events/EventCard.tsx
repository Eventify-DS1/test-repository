import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Calendar, MapPin, Users, CheckCircle2, Loader2 } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import eventPlaceholder from "@/assets/event-placeholder.jpg";
import { 
  checkInscriptionRequest, 
  subscribeToEventRequest, 
  unsubscribeFromEventRequest 
} from "@/api/events";
import { verifyTokenRequest } from "@/api/auth";

interface EventCardProps {
  id: string;
  title: string;
  category: string;
  date: string;
  time: string;
  location: string;
  capacity: number;
  registered: number;
  image?: string;
}

const EventCard = ({
  id,
  title,
  category,
  date,
  time,
  location,
  capacity,
  registered,
  image,
}: EventCardProps) => {
  const location_hook = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Detectar si estamos en el dashboard o en la vista pública
  const isFromDashboard = location_hook.pathname.startsWith('/dashboard');
  
  // Determinar la ruta correcta según el contexto
  const detailRoute = isFromDashboard ? `/dashboard/event/${id}` : `/event/${id}`;
  
  const spotsLeft = capacity - registered;
  
  // Verificar autenticación y estado de inscripción
  useEffect(() => {
    const checkAuthAndSubscription = async () => {
      try {
        // Verificar si el usuario está autenticado
        await verifyTokenRequest();
        setIsAuthenticated(true);
        
        // Verificar si está inscrito
        try {
          const response = await checkInscriptionRequest(parseInt(id));
          setIsSubscribed(response.data.esta_inscrito);
        } catch (error) {
          // Si falla, asumir que no está inscrito
          setIsSubscribed(false);
        }
      } catch (error) {
        // Usuario no autenticado
        setIsAuthenticated(false);
        setIsSubscribed(false);
      } finally {
        setIsChecking(false);
      }
    };
    
    checkAuthAndSubscription();
  }, [id]);
  
  const handleSubscribe = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast({
        title: "Debes iniciar sesión",
        description: "Necesitas estar autenticado para inscribirte en eventos.",
        variant: "default",
      });
      navigate('/login');
      return;
    }
    
    if (spotsLeft <= 0) {
      toast({
        title: "Evento lleno",
        description: "No hay cupos disponibles para este evento.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      await subscribeToEventRequest(parseInt(id));
      setIsSubscribed(true);
      toast({
        title: "¡Inscripción exitosa!",
        description: `Te has inscrito en "${title}"`,
        variant: "default",
      });
      // Recargar la página para actualizar el contador
      window.location.reload();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Error al inscribirse en el evento';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUnsubscribe = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsLoading(true);
    try {
      await unsubscribeFromEventRequest(parseInt(id));
      setIsSubscribed(false);
      toast({
        title: "Desinscripción exitosa",
        description: `Te has desinscrito de "${title}"`,
        variant: "default",
      });
      // Recargar la página para actualizar el contador
      window.location.reload();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Error al desinscribirse del evento';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const getCategoryColor = (cat: string) => {
    switch (cat.toLowerCase()) {
      case "académico":
        return "bg-accent/20 text-accent-foreground";
      case "deportivo":
        return "bg-secondary/20 text-secondary-foreground";
      case "cultural":
        return "bg-primary/20 text-primary";
      case "social":
        return "bg-amber-500/20 text-amber-700";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-soft transition-base group">
      <div className="relative h-48 overflow-hidden">
        <img
          src={image || eventPlaceholder}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <Badge className={`absolute top-3 right-3 ${getCategoryColor(category)}`}>
          {category}
        </Badge>
      </div>
      
      <CardHeader>
        <h3 className="text-xl font-semibold line-clamp-2 group-hover:text-primary transition-base">
          {title}
        </h3>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 text-primary" />
          <span>{date} • {time}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="line-clamp-1">{location}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <Users className="h-4 w-4 text-primary" />
          <span className="font-medium text-foreground">
            {spotsLeft > 0 ? (
              <span className="text-primary">{spotsLeft} cupos disponibles</span>
            ) : (
              <span className="text-destructive">Evento lleno</span>
            )}
          </span>
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-col gap-2">
        {isAuthenticated && !isChecking && (
          <Button
            onClick={isSubscribed ? handleUnsubscribe : handleSubscribe}
            disabled={isLoading || spotsLeft <= 0}
            className={`w-full ${
              isSubscribed
                ? "bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                : "gradient-primary text-white border-0"
            }`}
            variant={isSubscribed ? "secondary" : "default"}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isSubscribed ? "Desinscribiendo..." : "Inscribiendo..."}
              </>
            ) : isSubscribed ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Inscrito
              </>
            ) : spotsLeft <= 0 ? (
              "Evento lleno"
            ) : (
              "Inscribirse"
            )}
          </Button>
        )}
        <Button asChild className="w-full" variant="outline">
          <Link to={detailRoute}>Ver detalles</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default EventCard;