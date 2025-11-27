import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Calendar, GraduationCap, Building2, User, Loader2 } from "lucide-react";
import { getPublicProfileRequest } from "@/api/users";
import { getImageUrl } from "@/utils/imageHelpers";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Sidebar from "@/components/layout/Sidebar";
import { useLocation } from "react-router-dom";

interface PerfilPublico {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  nombre_completo: string;
  carrera: string | null;
  facultad: string | null;
  foto: string | null;
  rol_data: {
    id: number;
    nombre: string;
  };
  date_joined: string;
}

const PublicProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [perfil, setPerfil] = useState<PerfilPublico | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Detectar si viene del dashboard
  const isFromDashboard = location.pathname.startsWith('/dashboard');

  useEffect(() => {
    const fetchPerfil = async () => {
      if (!id) {
        setError("ID de usuario no válido");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await getPublicProfileRequest(parseInt(id));
        setPerfil(response.data);
      } catch (error: any) {
        console.error('Error al cargar perfil:', error);
        setError(
          error.response?.data?.detail || 
          'Error al cargar el perfil del usuario. Por favor, intenta de nuevo.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPerfil();
  }, [id]);

  const getInitials = () => {
    if (perfil) {
      const first = perfil.first_name?.charAt(0) || '';
      const last = perfil.last_name?.charAt(0) || '';
      return (first + last).toUpperCase() || perfil.username.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const Content = () => {
    if (loading) {
      return (
        <div className="container py-12 flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Cargando perfil...</p>
          </div>
        </div>
      );
    }

    if (error || !perfil) {
      return (
        <div className="container py-12 flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-xl font-semibold mb-4">{error || "Usuario no encontrado"}</p>
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="container py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>

        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-start gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={perfil.foto ? getImageUrl(perfil.foto) : undefined} alt={perfil.nombre_completo} />
                <AvatarFallback className="text-2xl gradient-primary text-white">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CardTitle className="text-3xl mb-2">{perfil.nombre_completo}</CardTitle>
                <CardDescription className="text-base">@{perfil.username}</CardDescription>
                {perfil.rol_data && (
                  <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                    <span className="h-2 w-2 rounded-full bg-primary"></span>
                    {perfil.rol_data.nombre}
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {(perfil.carrera || perfil.facultad) && (
              <div className="grid md:grid-cols-2 gap-4">
                {perfil.carrera && (
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                    <GraduationCap className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Carrera</p>
                      <p className="text-base font-semibold">{perfil.carrera}</p>
                    </div>
                  </div>
                )}
                {perfil.facultad && (
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                    <Building2 className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Facultad</p>
                      <p className="text-base font-semibold">{perfil.facultad}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
              <Calendar className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Miembro desde</p>
                <p className="text-base font-semibold">{formatDate(perfil.date_joined)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Layout condicional: Si viene del dashboard, usa Sidebar; si no, usa Header+Footer
  if (isFromDashboard) {
    return (
      <div className="flex min-h-screen w-full">
        <Sidebar />
        <main className="flex-1">
          <Content />
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <Content />
      </main>
      <Footer />
    </div>
  );
};

export default PublicProfile;

