import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, ArrowLeft, CheckCircle2, Loader2, Key, Star, Download, Share2, Mail, CalendarPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Sidebar from "@/components/layout/Sidebar";
import eventPlaceholder from "@/assets/event-placeholder.jpg";
import { getEventoByIdRequest, verifyTokenRequest } from "@/api/auth";
import { 
  checkInscriptionRequest, 
  subscribeToEventRequest, 
  unsubscribeFromEventRequest,
  confirmAttendanceRequest,
  addToFavoritesRequest,
  removeFromFavoritesRequest,
  sendMessageToInscritosRequest
} from "@/api/events";
import { getImageUrl } from "@/utils/imageHelpers";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { deleteEventRequest } from "@/api/events";
import { getEventReviewsRequest } from "@/api/reviews";
import ReviewCard from "@/components/events/ReviewCard";
import { useQuery } from "@tanstack/react-query";
import jsPDF from "jspdf";
import { generateGoogleCalendarLink } from "@/utils/googleCalendar";


// Interface para los datos del backend
interface Organizador {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  nombre_completo: string;
  foto?: string | null;
}

interface UsuarioInscrito {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  nombre_completo: string;
  email?: string | null;
  codigo_estudiantil?: string | null;
  foto?: string | null;
  asistencia_confirmada?: boolean;
}

interface Evento {
  id: number;
  titulo: string;
  descripcion: string;
  fecha_inicio: string;
  fecha_fin: string;
  aforo: number;
  ubicacion: string;
  foto: string | null;
  categoria: {
    id: number;
    nombre: string;
  } | null;
  organizador: Organizador;
  numero_inscritos: number;
  inscritos: UsuarioInscrito[];
  codigo_confirmacion?: string | null;
  is_favorito?: boolean;
}

const EventDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [evento, setEvento] = useState<Evento | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [asistenciaConfirmada, setAsistenciaConfirmada] = useState(false);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(false);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(true);
  // Usar el hook personalizado que cachea la información del usuario
  const isFromDashboard = location.pathname.startsWith('/dashboard');
  const { user: currentUser } = useCurrentUser({
    enabled: isFromDashboard, // Solo cargar si estamos en el dashboard
  });
  
  // El usuario efectivo solo se usa si estamos en el dashboard
  const effectiveCurrentUser = isFromDashboard ? currentUser : null;
  
  const [codigoConfirmacion, setCodigoConfirmacion] = useState("");
  const [isConfirming, setIsConfirming] = useState(false); 
  const [isFavorito, setIsFavorito] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [messageSubject, setMessageSubject] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Memoizar handlers para evitar re-renderizados innecesarios del Dialog
  const handleSubjectChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    setMessageSubject(e.target.value);
  }, []);

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.stopPropagation();
    setMessageContent(e.target.value);
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (!id || !evento || !messageSubject.trim() || !messageContent.trim()) {
      toast({
        title: "Error",
        description: "Por favor, completa todos los campos del mensaje.",
        variant: "destructive",
      });
      return;
    }

    setIsSendingMessage(true);
    try {
      await sendMessageToInscritosRequest(parseInt(id), messageSubject.trim(), messageContent.trim());
      toast({
        title: "Mensaje enviado",
        description: `El mensaje se está enviando a ${evento.inscritos?.length || 0} participante(s).`,
        variant: "default",
      });
      setIsMessageDialogOpen(false);
      // Limpiar campos después de un pequeño delay para evitar re-render durante el cierre
      setTimeout(() => {
        setMessageSubject("");
        setMessageContent("");
      }, 200);
    } catch (error: any) {
      console.error('Error al enviar mensaje:', error);
      toast({
        title: "Error al enviar mensaje",
        description: error.response?.data?.detail || "No se pudo enviar el mensaje. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSendingMessage(false);
    }
  }, [id, evento, messageSubject, messageContent, toast]);

  // Verificar si el evento terminó (fecha_fin < hoy)
  const isEventFinished = evento ? new Date(evento.fecha_fin) < new Date() : false;

  // Obtener reviews del evento si terminó
  const { data: reviews, isLoading: loadingReviews, error: reviewsError } = useQuery({
    queryKey: ['event-reviews', id],
    queryFn: async () => {
      if (!id) return [];
      try {
        const response = await getEventReviewsRequest(parseInt(id));
        // Manejar paginación si existe
        if (response.data.results) {
          return response.data.results;
        }
        // Si es un array directo
        if (Array.isArray(response.data)) {
          return response.data;
        }
        return [];
      } catch (error) {
        console.error('Error obteniendo reviews:', error);
        return [];
      }
    },
    enabled: !!id && !!evento && isEventFinished,
  });

  useEffect(() => {
    // Solo verificar autenticación si estamos en el dashboard (páginas de usuario registrado)
    // En páginas públicas, no hacer ninguna verificación
    if (!isFromDashboard) {
      setIsAuthenticated(false);
      setIsSubscribed(false);
      setIsCheckingSubscription(false);
      return;
    }

    const checkAuthAndSubscription = async () => {
      try {
        await verifyTokenRequest();
        setIsAuthenticated(true);
        
        // Verificar si está inscrito y si asistencia está confirmada
        if (id) {
          try {
            const response = await checkInscriptionRequest(parseInt(id));
            setIsSubscribed(response.data.esta_inscrito);
            setAsistenciaConfirmada(response.data.asistencia_confirmada || false);
          } catch (error) {
            setIsSubscribed(false);
            setAsistenciaConfirmada(false);
          }
        }
      } catch (error: any) {
        // Usuario no autenticado - 401 es esperado, no mostrar error
        const status = error?.response?.status;
        if (status !== 401) {
          // Solo loggear errores que no sean 401 (no autorizado)
          console.error('Error verificando autenticación:', error);
        }
        setIsAuthenticated(false);
        setIsSubscribed(false);
      } finally {
        setIsCheckingSubscription(false);
      }
    };
    
    checkAuthAndSubscription();
  }, [id, isFromDashboard]);

  useEffect(() => {
    const fetchEvento = async () => {
      if (!id) {
        setError("ID de evento no válido");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await getEventoByIdRequest(id);
        setEvento(response.data);
        setIsFavorito(response.data.is_favorito || false);
        setIsFavorito(response.data.is_favorito || false);
      } catch (error: unknown) {
        console.error('Error al cargar evento:', error);
        setError("No se pudo cargar el evento");
      } finally {
        setLoading(false);
      }
    };  

    fetchEvento();
  }, [id]);

  // El usuario ya está cargado desde el hook useCurrentUser
  // No necesitamos un useEffect adicional

  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleSubscribe = async () => {
    if (!id || !evento) return;
    
    // Validar que el propietario no se pueda inscribir
    if (effectiveCurrentUser?.id === evento?.organizador?.id) {
      toast({
        title: "No puedes inscribirte",
        description: "No puedes inscribirte en tu propio evento.",
        variant: "destructive",
      });
      return;
    }
    
    // Validar que el evento no haya terminado
    if (isEventFinished) {
      toast({
        title: "Evento finalizado",
        description: "No puedes inscribirte en un evento que ya ha terminado.",
        variant: "destructive",
      });
      return;
    }
    
    if (!isAuthenticated) {
      toast({
        title: "Debes iniciar sesión",
        description: "Necesitas estar autenticado para inscribirte en eventos.",
        variant: "default",
      });
      navigate('/login');
      return;
    }
    
    const registered = evento.numero_inscritos || 0;
    const spotsLeft = evento.aforo - registered;
    
    if (spotsLeft <= 0) {
      toast({
        title: "Evento lleno",
        description: "No hay cupos disponibles para este evento.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoadingSubscription(true);
    try {
      await subscribeToEventRequest(parseInt(id));
      setIsSubscribed(true);
      setAsistenciaConfirmada(false);
      toast({
        title: "¡Inscripción exitosa!",
        description: `Te has inscrito en "${evento?.titulo}". Ahora ingresa el código de confirmación.`,
        variant: "default",
      });
      // Recargar el evento para actualizar el contador
      if (id) {
        const response = await getEventoByIdRequest(id);
        setEvento(response.data);
        setIsFavorito(response.data.is_favorito || false);
        // Recargar estado de inscripción
        const checkResponse = await checkInscriptionRequest(parseInt(id));
        setIsSubscribed(checkResponse.data.esta_inscrito);
        setAsistenciaConfirmada(checkResponse.data.asistencia_confirmada || false);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Error al inscribirse en el evento';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoadingSubscription(false);
    }
  };
  
  const handleUnsubscribe = async () => {
    if (!id) return;
    
    if (asistenciaConfirmada) {
      toast({
        title: "No puedes desinscribirte",
        description: "No puedes desinscribirte porque tu asistencia ya está confirmada.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoadingSubscription(true);
    try {
      await unsubscribeFromEventRequest(parseInt(id));
      setIsSubscribed(false);
      setAsistenciaConfirmada(false);
      toast({
        title: "Desinscripción exitosa",
        description: `Te has desinscrito de "${evento?.titulo}"`,
        variant: "default",
      });
      // Recargar el evento para actualizar el contador
      if (id) {
        const response = await getEventoByIdRequest(id);
        setEvento(response.data);
        setIsFavorito(response.data.is_favorito || false);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Error al desinscribirse del evento';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoadingSubscription(false);
    }
  };
  
  const handleConfirmAttendance = async () => {
    if (!id || !codigoConfirmacion.trim()) {
      toast({
        title: "Código requerido",
        description: "Por favor ingresa el código de confirmación.",
        variant: "destructive",
      });
      return;
    }
    
    setIsConfirming(true);
    try {
      await confirmAttendanceRequest(parseInt(id), codigoConfirmacion.trim().toUpperCase());
      setAsistenciaConfirmada(true);
      setCodigoConfirmacion("");
      toast({
        title: "¡Asistencia confirmada!",
        description: "Tu asistencia ha sido confirmada exitosamente.",
        variant: "default",
      });
      // Recargar el evento
      if (id) {
        const response = await getEventoByIdRequest(id);
        setEvento(response.data);
        setIsFavorito(response.data.is_favorito || false);
        const checkResponse = await checkInscriptionRequest(parseInt(id));
        setAsistenciaConfirmada(checkResponse.data.asistencia_confirmada || false);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Error al confirmar asistencia';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsConfirming(false);
    }
  };

  const backRoute = isFromDashboard ? "/dashboard/search" : "/eventos";
  const fromCalendar = location.state?.fromCalendar || false;
  const fromRateEvents = location.state?.fromRateEvents || false;
  const fromSearch = location.state?.fromSearch || (isFromDashboard && !fromCalendar && !fromRateEvents);
  
  let backRouteFinal = backRoute;
  let backTextFinal = isFromDashboard ? "Volver a eventos" : "Volver a eventos";
  
  if (fromCalendar) {
    backRouteFinal = isFromDashboard ? "/dashboard/calendario" : "/calendario";
    backTextFinal = "Volver a calendario";
  } else if (fromRateEvents) {
    backRouteFinal = "/dashboard/rate";
    backTextFinal = "Volver a calificar eventos";
  } else if (fromSearch) {
    backRouteFinal = "/dashboard/search";
    backTextFinal = "Volver a buscar eventos";
  }

  const EventContent = () => {
    if (loading) {
      return (
        <div className="container py-12 flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Cargando evento...</p>
        </div>
      );
    }

    if (error || !evento) {
      return (
        <div className="container py-12 flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-xl font-semibold mb-4">{error || "Evento no encontrado"}</p>
            <Button variant="outline" asChild>
              <Link to={backRouteFinal}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {backTextFinal}
              </Link>
            </Button>
          </div>
        </div>
      );
    }

    const registered = evento.numero_inscritos || 0;
    const spotsLeft = evento.aforo - registered;

    const isOwner = effectiveCurrentUser?.id === evento?.organizador?.id;

    const handleDelete = async (id: number) => {
      if (!confirm("¿Seguro que quieres eliminar este evento?")) return;
      try {
        await deleteEventRequest(id);
        alert("Evento eliminado");
        window.location.href = "/dashboard/search";
      } catch (err) {
        console.error(err);
        alert("No se pudo eliminar el evento");
      }
    };

    const handleToggleFavorite = async () => {
      if (!id || !evento) return;
      
      setIsTogglingFavorite(true);
      try {
        if (isFavorito) {
          await removeFromFavoritesRequest(parseInt(id));
          setIsFavorito(false);
          toast({
            title: "Eliminado de favoritos",
            description: "El evento ha sido eliminado de tus favoritos.",
            variant: "default",
          });
        } else {
          await addToFavoritesRequest(parseInt(id));
          setIsFavorito(true);
          toast({
            title: "Agregado a favoritos",
            description: "El evento ha sido agregado a tus favoritos.",
            variant: "default",
          });
        }
        // Actualizar el evento para reflejar el cambio
        const response = await getEventoByIdRequest(id);
        setEvento(response.data);
        setIsFavorito(response.data.is_favorito || false);
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || 'Error al actualizar favoritos';
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsTogglingFavorite(false);
    }
  };

  const handleShareEvent = async () => {
      if (!id) return;
      
      // Construir la URL completa del evento
      const eventUrl = `${window.location.origin}${isFromDashboard ? '/dashboard/event' : '/event'}/${id}`;
      
      try {
        // Intentar usar la API moderna de compartir si está disponible
        if (navigator.share) {
          await navigator.share({
            title: evento?.titulo || 'Evento',
            text: evento?.descripcion || 'Mira este evento',
            url: eventUrl,
          });
          toast({
            title: "Evento compartido",
            description: "El evento se ha compartido exitosamente.",
            variant: "default",
          });
        } else {
          // Fallback: copiar al portapapeles
          await navigator.clipboard.writeText(eventUrl);
          toast({
            title: "Link copiado",
            description: "El link del evento se ha copiado al portapapeles.",
            variant: "default",
          });
        }
      } catch (error: any) {
        // Si el usuario cancela el share, no mostrar error
        if (error.name === 'AbortError') {
          return;
        }
        
        // Fallback: intentar copiar al portapapeles
        try {
          await navigator.clipboard.writeText(eventUrl);
          toast({
            title: "Link copiado",
            description: "El link del evento se ha copiado al portapapeles.",
            variant: "default",
          });
        } catch (clipboardError) {
          toast({
            title: "Error",
            description: "No se pudo copiar el link. Por favor, cópialo manualmente.",
            variant: "destructive",
          });
        }
      }
    };

    const handleExportPDF = () => {
      if (!evento || !evento.inscritos || evento.inscritos.length === 0) {
        toast({
          title: "No hay participantes",
          description: "No hay participantes inscritos para exportar.",
          variant: "destructive",
        });
        return;
      }

      const doc = new jsPDF();
      
      // Configuración de fuente y colores
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const lineHeight = 8;
      let yPosition = margin;

      // Título del documento
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("Lista de Participantes", pageWidth / 2, yPosition, { align: "center" });
      yPosition += 10;

      // Información del evento
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Evento:", margin, yPosition);
      yPosition += lineHeight;
      doc.setFont("helvetica", "normal");
      doc.text(evento.titulo, margin, yPosition);
      yPosition += lineHeight;
      
      doc.setFont("helvetica", "bold");
      doc.text("Fecha:", margin, yPosition);
      yPosition += lineHeight;
      doc.setFont("helvetica", "normal");
      doc.text(formatDate(evento.fecha_inicio), margin, yPosition);
      yPosition += lineHeight;
      
      doc.setFont("helvetica", "bold");
      doc.text("Ubicación:", margin, yPosition);
      yPosition += lineHeight;
      doc.setFont("helvetica", "normal");
      doc.text(evento.ubicacion, margin, yPosition);
      yPosition += 15;

      // Encabezados de la tabla
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      const colWidths = [60, 50, 50, 30]; // Anchos de columnas
      const headers = ["Nombre", "Email", "Código", "Username"];
      let xPosition = margin;
      
      headers.forEach((header, index) => {
        doc.text(header, xPosition, yPosition);
        xPosition += colWidths[index];
      });
      yPosition += lineHeight + 2;

      // Línea separadora
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 5;

      // Datos de los participantes
      doc.setFont("helvetica", "normal");
      evento.inscritos.forEach((participante, index) => {
        // Verificar si necesitamos una nueva página
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = margin;
        }

        const nombre = participante.nombre_completo || participante.username || "N/A";
        const email = participante.email || "N/A";
        const codigo = participante.codigo_estudiantil || "N/A";
        const username = participante.username || "N/A";

        xPosition = margin;
        doc.text(nombre.substring(0, 25), xPosition, yPosition); // Limitar longitud
        xPosition += colWidths[0];
        doc.text(email.substring(0, 20), xPosition, yPosition);
        xPosition += colWidths[1];
        doc.text(codigo.substring(0, 15), xPosition, yPosition);
        xPosition += colWidths[2];
        doc.text(username.substring(0, 15), xPosition, yPosition);
        
        yPosition += lineHeight + 2;
      });

      // Pie de página
      yPosition = pageHeight - 15;
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.text(
        `Total de participantes: ${evento.inscritos.length} | Generado el ${new Date().toLocaleDateString('es-ES')}`,
        pageWidth / 2,
        yPosition,
        { align: "center" }
      );

      // Guardar el PDF
      const fileName = `participantes_${evento.titulo.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      toast({
        title: "PDF exportado",
        description: `Se ha exportado la lista de ${evento.inscritos.length} participantes.`,
        variant: "default",
      });
    };



    return (
      <div className={isFromDashboard ? "p-8" : "container py-12"}>
            <Button variant="ghost" asChild className="mb-6">
          <Link to={backRouteFinal}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {backTextFinal}
          </Link>
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="relative h-96 rounded-2xl overflow-hidden">
              <img
                src={getImageUrl(evento.foto) || eventPlaceholder}
                alt={evento.titulo}
                className="w-full h-full object-cover"
              />
            </div>

            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h1 className="text-4xl font-bold">{evento.titulo}</h1>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleShareEvent}
                        className="p-2 rounded-full transition-all bg-muted hover:bg-muted/80 text-muted-foreground"
                        title="Compartir evento"
                      >
                        <Share2 className="h-5 w-5" />
                      </button>
                      {isAuthenticated && (
                        <button
                          onClick={handleToggleFavorite}
                          disabled={isTogglingFavorite}
                          className={`p-2 rounded-full transition-all ${
                            isFavorito
                              ? "bg-yellow-400 hover:bg-yellow-500 text-yellow-900"
                              : "bg-muted hover:bg-muted/80 text-muted-foreground"
                          }`}
                          title={isFavorito ? "Quitar de favoritos" : "Agregar a favoritos"}
                        >
                          <Star className={`h-5 w-5 ${isFavorito ? "fill-current" : ""}`} />
                        </button>
                      )}
                    </div>
                  </div>
                  <Badge className="bg-primary/20 text-primary text-sm">
                    {evento.categoria?.nombre || "Sin categoría"}
                  </Badge>
                </div>
              </div>

              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                {evento.descripcion}
              </p>

              {/* Sección de Comentarios y Calificaciones - Solo si el evento terminó */}
              {isEventFinished && (
                <div className="pt-6 border-t">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold">Comentarios y Calificaciones</h3>
                    {isAuthenticated && isSubscribed && asistenciaConfirmada && (
                      <Button
                        onClick={() => navigate(`/dashboard/rate/${id}`, { 
                          state: { 
                            fromRateEvents: fromRateEvents,
                            fromSearch: fromSearch 
                          } 
                        })}
                        className="gradient-primary text-white border-0"
                        size="sm"
                      >
                        <Star className="mr-2 h-4 w-4" />
                        Calificar evento
                      </Button>
                    )}
                  </div>
                  
                  {loadingReviews ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : reviewsError ? (
                    <div className="text-center py-8 border border-dashed rounded-lg">
                      <p className="text-muted-foreground mb-4">
                        Error al cargar los comentarios. Por favor, intenta de nuevo.
                      </p>
                    </div>
                  ) : reviews && Array.isArray(reviews) && reviews.length > 0 ? (
                    <div className="max-h-[600px] overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                      {reviews.map((review: any) => (
                        <ReviewCard
                          key={review.id}
                          review={review}
                          currentUserId={effectiveCurrentUser?.id}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 border border-dashed rounded-lg">
                      <p className="text-muted-foreground mb-4">
                        Aún no hay comentarios para este evento.
                      </p>
                      {isAuthenticated && isSubscribed && asistenciaConfirmada && (
                        <Button
                          onClick={() => navigate(`/dashboard/rate/${id}`, { 
                            state: { 
                              fromRateEvents: fromRateEvents,
                              fromSearch: fromSearch 
                            } 
                          })}
                          className="gradient-primary text-white border-0"
                          size="sm"
                        >
                          <Star className="mr-2 h-4 w-4" />
                          Sé el primero en calificar
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-card border rounded-2xl p-6 shadow-card sticky top-24 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha de inicio</p>
                    <p className="font-medium">{formatDate(evento.fecha_inicio)}</p>
                    <p className="text-xs text-muted-foreground">{formatTime(evento.fecha_inicio)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-secondary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha de finalización</p>
                    <p className="font-medium">{formatDate(evento.fecha_fin)}</p>
                    <p className="text-xs text-muted-foreground">{formatTime(evento.fecha_fin)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-accent" />
                  <div>
                    <p className="text-sm text-muted-foreground">Ubicación</p>
                    <p className="font-medium">{evento.ubicacion}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Asistentes inscritos</p>
                    <p className="font-medium">
                      {registered} / {evento.aforo} personas
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

                {isAuthenticated && !isCheckingSubscription ? (
                  <>
                    {!isSubscribed ? (
                      <Button
                        onClick={handleSubscribe}
                        disabled={isLoadingSubscription || spotsLeft <= 0 || isEventFinished || (effectiveCurrentUser?.id === evento?.organizador?.id)}
                        className="w-full gradient-primary text-white border-0"
                      >
                        {isLoadingSubscription ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Inscribiendo...
                          </>
                        ) : isEventFinished ? (
                          "Evento finalizado"
                        ) : effectiveCurrentUser?.id === evento?.organizador?.id ? (
                          "Eres el organizador"
                        ) : spotsLeft <= 0 ? (
                          "Evento lleno"
                        ) : (
                          "Inscribirse al evento"
                        )}
                      </Button>
                    ) : asistenciaConfirmada ? (
                      <Button
                        disabled
                        className="w-full bg-green-600 text-white"
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Asistencia Confirmada
                      </Button>
                    ) : (
                      <Button
                        disabled
                        className="w-full bg-secondary text-secondary-foreground"
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Inscrito
                      </Button>
                    )}
                  </>
                ) : isAuthenticated ? (
                  <Button
                    disabled
                    className="w-full gradient-primary text-white border-0"
                  >
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verificando...
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={() => navigate('/register')}
                      className="w-full gradient-primary text-white border-0"
                    >
                      Registrarse para asistir
                    </Button>
                    <p className="text-xs text-center text-muted-foreground mt-2">
                      Debes registrarte para poder inscribirte en eventos
                    </p>
                    <p className="text-xs text-center text-muted-foreground">
                      ¿Ya tienes cuenta?{" "}
                      <button
                        onClick={() => navigate('/login')}
                        className="text-primary hover:underline font-medium"
                      >
                        Inicia sesión
                      </button>
                    </p>
                  </>
                )}
                
                {/* Campo de código de confirmación - solo si está inscrito y no confirmado */}
                {isAuthenticated && isSubscribed && !asistenciaConfirmada && (
                  <div className="mt-4 space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Código de confirmación
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="Ingresa el código"
                        value={codigoConfirmacion}
                        onChange={(e) => setCodigoConfirmacion(e.target.value.toUpperCase())}
                        maxLength={10}
                        className="flex-1 uppercase"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleConfirmAttendance();
                          }
                        }}
                      />
                      <Button
                        onClick={handleConfirmAttendance}
                        disabled={isConfirming || !codigoConfirmacion.trim()}
                        className="gradient-primary text-white border-0"
                      >
                        {isConfirming ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Key className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Solicita el código al organizador del evento para confirmar tu asistencia.
                    </p>
                  </div>
                )}
                
                {/* Mostrar si asistencia está confirmada */}
                {isAuthenticated && isSubscribed && asistenciaConfirmada && (
                  <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-5 w-5" />
                      <p className="text-sm font-medium">Asistencia confirmada</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Ya no puedes desinscribirte de este evento.
                    </p>
                  </div>
                )}
                
                {/* Botón de desinscripción - solo si está inscrito y NO confirmado */}
                {isAuthenticated && isSubscribed && !asistenciaConfirmada && (
                  <Button
                    onClick={handleUnsubscribe}
                    disabled={isLoadingSubscription}
                    variant="outline"
                    className="w-full mt-2"
                  >
                    Desinscribirse
                  </Button>
                )}
                
                {/* Botón para añadir a Google Calendar */}
                <Button
                  asChild
                  className="w-full mt-2"
                  variant="outline"
                >
                  <a
                    href={generateGoogleCalendarLink({
                      title: evento.titulo,
                      description: evento.descripcion || '',
                      location: evento.ubicacion,
                      startDate: evento.fecha_inicio,
                      endDate: evento.fecha_fin,
                    })}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <CalendarPlus className="mr-2 h-4 w-4" />
                    Añadir a Google Calendar
                  </a>
                </Button>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Organizado por:</p>
                <button
                  onClick={() => evento.organizador?.id && navigate(isFromDashboard ? `/dashboard/user/${evento.organizador.id}` : `/user/${evento.organizador.id}`)}
                  className="font-semibold hover:text-primary transition-colors cursor-pointer text-left"
                >
                  {evento.organizador?.nombre_completo || evento.organizador?.username || 'Desconocido'}
                </button>
              </div>
              
              {/* Mostrar código de confirmación al organizador */}
              {isOwner && evento.codigo_confirmacion && (
                <div className="pt-4 border-t">
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Key className="h-4 w-4 text-primary" />
                      <p className="text-sm font-semibold text-primary">Código de Confirmación</p>
                    </div>
                    <p className="text-2xl font-bold text-center tracking-widest mb-2">
                      {evento.codigo_confirmacion}
                    </p>
                    <p className="text-xs text-muted-foreground text-center">
                      Comparte este código con los asistentes para que confirmen su asistencia
                    </p>
                  </div>
                </div>
              )}
              {isOwner && (
                <div className="space-y-3 mt-6">
                  {!isEventFinished && (
                    <>
                      <Button 
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white border-0"
                        variant="default"
                        onClick={() => setIsMessageDialogOpen(true)}
                      >
                        <Mail className="mr-2 h-4 w-4" />
                        Enviar mensaje a inscritos
                      </Button>
                      <Button 
                        className="w-full gradient-primary text-white border-0" 
                        asChild
                      >
                    <Link to={`/dashboard/eventos/editar/${evento.id}`}>Editar evento</Link>
                    </Button>
                    <Button
                        className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                        variant="destructive"
                    onClick={() => handleDelete(evento.id)}
                    >
                      Borrar evento
                      </Button>
                    </>
                  )}
                  {isEventFinished && (
                    <div className="p-4 bg-muted rounded-lg border border-border">
                      <p className="text-sm text-muted-foreground text-center">
                        Este evento ya ha finalizado. No se pueden realizar modificaciones ni enviar mensajes.
                      </p>
                    </div>
                  )}
                      </div>
                    )}


              {evento.inscritos && evento.inscritos.length > 0 ? (
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold">
                    Asistentes inscritos ({evento.inscritos.length})
                  </p>
                    {isOwner && (
                      <Button
                        onClick={handleExportPDF}
                        size="sm"
                        variant="outline"
                        className="h-8 px-3"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Exportar PDF
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {evento.inscritos.map((inscrito) => (
                      <div
                        key={inscrito.id}
                        className={`flex items-center gap-3 p-2 rounded-lg transition-base ${
                          inscrito.asistencia_confirmada
                            ? "bg-green-50 border border-green-200 hover:bg-green-100"
                            : "bg-muted/50 hover:bg-muted"
                        }`}
                      >
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${
                          inscrito.asistencia_confirmada
                            ? "bg-green-600"
                            : "gradient-primary"
                        }`}>
                          {inscrito.nombre_completo?.charAt(0).toUpperCase() || inscrito.username?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => navigate(isFromDashboard ? `/dashboard/user/${inscrito.id}` : `/user/${inscrito.id}`)}
                              className="text-sm font-medium truncate hover:text-primary transition-colors cursor-pointer text-left"
                            >
                            {inscrito.nombre_completo || inscrito.username}
                            </button>
                            {inscrito.asistencia_confirmada && (
                              <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                            )}
                          </div>
                          {inscrito.nombre_completo && (
                            <p className="text-xs text-muted-foreground truncate">
                              @{inscrito.username}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="pt-4 border-t">
                  <p className="text-sm font-semibold mb-2">Asistentes inscritos</p>
                  <p className="text-sm text-muted-foreground">
                    Aún no hay asistentes inscritos en este evento.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Layout condicional: Si viene del dashboard, usa Sidebar; si no, usa Header+Footer
  if (isFromDashboard) {
    return (
      <>
      <div className="flex min-h-screen w-full">
        <Sidebar />
        <main className="flex-1">
          <EventContent />
        </main>
      </div>
        {/* Dialog fuera de EventContent para evitar re-renderizados */}
        <Dialog 
          open={isMessageDialogOpen} 
          onOpenChange={(open) => {
            setIsMessageDialogOpen(open);
            if (!open) {
              // Limpiar campos solo cuando se cierra el modal
              setTimeout(() => {
                setMessageSubject("");
                setMessageContent("");
              }, 100);
            }
          }}
        >
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Enviar mensaje a participantes</DialogTitle>
              <DialogDescription>
                Escribe un mensaje que se enviará por correo electrónico a todos los participantes inscritos en este evento.
                {evento?.inscritos && evento.inscritos.length > 0 && (
                  <span className="block mt-1 font-medium text-foreground">
                    Se enviará a {evento.inscritos.length} participante(s).
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Asunto</Label>
                <Input
                  id="subject"
                  placeholder="Ej: Recordatorio importante sobre el evento"
                  value={messageSubject}
                  onChange={handleSubjectChange}
                  disabled={isSendingMessage}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Mensaje</Label>
                <Textarea
                  id="message"
                  placeholder="Escribe tu mensaje aquí..."
                  value={messageContent}
                  onChange={handleContentChange}
                  disabled={isSendingMessage}
                  rows={8}
                  className="resize-none"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsMessageDialogOpen(false);
                }}
                disabled={isSendingMessage}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSendMessage}
                disabled={isSendingMessage || !messageSubject.trim() || !messageContent.trim()}
                className="gradient-primary text-white border-0"
              >
                {isSendingMessage ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Enviar mensaje
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
    <div className="min-h-screen flex flex-col">
      <Header />
      <EventContent />
      <Footer />
    </div>
      {/* Dialog fuera de EventContent para evitar re-renderizados */}
      <Dialog 
        open={isMessageDialogOpen} 
        onOpenChange={(open) => {
          setIsMessageDialogOpen(open);
          if (!open) {
            // Limpiar campos solo cuando se cierra el modal
            setTimeout(() => {
              setMessageSubject("");
              setMessageContent("");
            }, 100);
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Enviar mensaje a participantes</DialogTitle>
            <DialogDescription>
              Escribe un mensaje que se enviará por correo electrónico a todos los participantes inscritos en este evento.
              {evento?.inscritos && evento.inscritos.length > 0 && (
                <span className="block mt-1 font-medium text-foreground">
                  Se enviará a {evento.inscritos.length} participante(s).
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Asunto</Label>
              <Input
                id="subject"
                placeholder="Ej: Recordatorio importante sobre el evento"
                value={messageSubject}
                onChange={handleSubjectChange}
                disabled={isSendingMessage}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Mensaje</Label>
              <Textarea
                id="message"
                placeholder="Escribe tu mensaje aquí..."
                value={messageContent}
                onChange={handleContentChange}
                disabled={isSendingMessage}
                rows={8}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsMessageDialogOpen(false);
              }}
              disabled={isSendingMessage}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={isSendingMessage || !messageSubject.trim() || !messageContent.trim()}
              className="gradient-primary text-white border-0"
            >
              {isSendingMessage ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Enviar mensaje
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EventDetail;