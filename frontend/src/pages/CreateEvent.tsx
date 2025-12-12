import Sidebar from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { verifyTokenRequest, getCategoriasRequest } from "@/api/auth";
import { createEventRequest } from "@/api/event";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

interface Categoria {
  id: number;
  nombre: string;
}

const CreateEvent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [category, setCategory] = useState("");
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Obtener datos de plantilla desde location.state si existen
  const templateData = location.state?.templateData as {
    titulo?: string;
    descripcion?: string;
    aforo?: number;
    ubicacion?: string;
    categoria_id?: number;
    fecha_inicio?: string;
    fecha_fin?: string;
  } | undefined;

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await verifyTokenRequest();
        console.log("Usuario autenticado:", response.data);
      } catch (error) {
        console.error("No autenticado:", error);
        toast.error("Debes iniciar sesión para crear eventos");
        navigate("/login");
      }
    };
    
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const response = await getCategoriasRequest();
        const categoriasData = response.data.results || response.data;
        setCategorias(Array.isArray(categoriasData) ? categoriasData : []);
        
        // Si hay datos de plantilla, establecer la categoría
        if (templateData?.categoria_id) {
          setCategory(templateData.categoria_id.toString());
        }
      } catch (error) {
        console.error("Error al cargar categorías:", error);
        toast.error("No se pudieron cargar las categorías");
      }
    };

    fetchCategorias();
  }, [templateData]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const fechaInicio = new Date(form.fecha_inicio.value);
    const fechaFin = new Date(form.fecha_fin.value);
    const today = new Date();

    if (fechaInicio < today) {
      toast.error("La fecha de inicio no puede ser anterior a hoy");
      return;
    }
    if (fechaFin < fechaInicio) {
      toast.error("La fecha de finalización no puede ser anterior al inicio");
      return;
    }

    if (!category) {
      toast.error("Debes seleccionar una categoría");
      return;
    }

    formData.append("categoria_id", category);

    console.log("=== DATOS DEL FORMULARIO ===");
    for (let [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }

    try {
      setLoading(true);
      const response = await createEventRequest(formData);
      console.log("✅ Evento creado:", response.data);
      toast.success("Evento creado exitosamente");
      form.reset();
      setCategory("");
      
      // ✅ CAMBIO: Redirigir al dashboard/search (vista de usuario autenticado)
      setTimeout(() => {
        navigate("/dashboard/search");
      }, 1500);
    } catch (error: any) {
      console.error("=== ERROR COMPLETO ===");
      if (error.response) {
        console.error("Status:", error.response.status);
        console.error("Data:", error.response.data);
        console.error("Headers:", error.response.headers);

        if (error.response.status === 401) {
          toast.error("No estás autenticado. Por favor inicia sesión.");
          navigate("/login");
        } else if (error.response.status === 403) {
          toast.error("No tienes permisos para crear eventos.");
        } else if (error.response.data) {
          const errorMessages = Object.entries(error.response.data)
            .map(([field, messages]) => {
              if (Array.isArray(messages)) {
                return `${field}: ${messages.join(", ")}`;
              }
              return `${field}: ${messages}`;
            })
            .join("\n");
          toast.error(errorMessages || "Error al crear el evento");
        } else {
          toast.error("Error al crear el evento");
        }
      } else if (error.request) {
        console.error("Request:", error.request);
        toast.error("No se pudo conectar con el servidor");
      } else {
        console.error("Error:", error.message);
        toast.error("Error desconocido");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Crear Nuevo Evento</h1>
          <p className="text-muted-foreground">
            Completa la información para publicar tu evento
          </p>
        </div>

        <Card className="max-w-3xl shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Información del Evento
            </CardTitle>
            <CardDescription>Todos los campos son obligatorios</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Título */}
              <div className="space-y-2">
                <Label htmlFor="titulo">Título del evento</Label>
                <Input
                  id="titulo"
                  name="titulo"
                  placeholder="Ej: Workshop de Inteligencia Artificial"
                  required
                  disabled={loading}
                  defaultValue={templateData?.titulo || ""}
                />
              </div>

              {/* Descripción */}
              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  name="descripcion"
                  placeholder="Describe tu evento..."
                  rows={5}
                  required
                  disabled={loading}
                  defaultValue={templateData?.descripcion || ""}
                />
              </div>

              {/* Fechas */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fecha_inicio">Fecha de inicio</Label>
                  <Input
                    type="datetime-local"
                    id="fecha_inicio"
                    name="fecha_inicio"
                    required
                    disabled={loading}
                    onKeyDown={(e) => e.preventDefault()}
                    defaultValue={templateData?.fecha_inicio ? 
                      new Date(templateData.fecha_inicio).toISOString().slice(0, 16) : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fecha_fin">Fecha de fin</Label>
                  <Input
                    type="datetime-local"
                    id="fecha_fin"
                    name="fecha_fin"
                    required
                    disabled={loading}
                    onKeyDown={(e) => e.preventDefault()}
                    defaultValue={templateData?.fecha_fin ? 
                      new Date(templateData.fecha_fin).toISOString().slice(0, 16) : ""}
                  />
                </div>
              </div>

              {/* Aforo + Categoría */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="aforo">Aforo máximo</Label>
                  <Input
                    type="number"
                    id="aforo"
                    name="aforo"
                    placeholder="100"
                    min="1"
                    required
                    disabled={loading}
                    defaultValue={templateData?.aforo || ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Categoría</Label>
                  <Select
                    value={category}
                    onValueChange={setCategory}
                    required
                    disabled={loading}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.length > 0 ? (
                        categorias.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id.toString()}>
                            {cat.nombre}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="loading" disabled>
                          Cargando categorías...
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Ubicación */}
              <div className="space-y-2">
                <Label htmlFor="ubicacion">Ubicación</Label>
                <Input
                  id="ubicacion"
                  name="ubicacion"
                  placeholder="Ej: Auditorio Principal"
                  required
                  disabled={loading}
                  defaultValue={templateData?.ubicacion || ""}
                />
              </div>

              {/* Imagen */}
              <div className="space-y-2">
                <Label htmlFor="foto">Imagen del evento (opcional)</Label>
                <Input 
                  id="foto" 
                  name="foto" 
                  type="file" 
                  accept="image/*"
                  disabled={loading}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  className="flex-1 gradient-primary text-white border-0"
                  disabled={loading}
                >
                  {loading ? "Creando evento..." : "Publicar evento"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => navigate("/dashboard/search")}
                  disabled={loading}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CreateEvent;
