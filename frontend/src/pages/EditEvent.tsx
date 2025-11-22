import Sidebar from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { verifyTokenRequest, getCategoriasRequest } from "@/api/auth";
import { updateEventRequest, getEventByIdRequest } from "@/api/events";
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
import { useNavigate, useParams } from "react-router-dom";

interface Categoria {
  id: number;
  nombre: string;
}

const EditEvent = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [evento, setEvento] = useState<any>(null);
  const [category, setCategory] = useState("");
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await verifyTokenRequest();
      } catch (error) {
        toast.error("Debes iniciar sesión");
        navigate("/login");
      }
    };
    checkAuth();
  }, []);

  // Traer categorías
  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const response = await getCategoriasRequest();
        const categoriasData = response.data.results || response.data;
        setCategorias(categoriasData);
      } catch {
        toast.error("Error cargando categorías");
      }
    };
    fetchCategorias();
  }, []);

  // Traer evento actual
  useEffect(() => {
    const fetchEvento = async () => {
      try {
        const response = await getEventByIdRequest(id!);
        setEvento(response.data);
        setCategory(response.data.categoria?.id?.toString() || "");
      } catch (e) {
        toast.error("Error cargando evento");
      }
    };
    fetchEvento();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    formData.append("categoria_id", category);

    try {
      setLoading(true);

      const res = await updateEventRequest(id!, formData);
      toast.success("Evento actualizado");
      navigate("/dashboard/search");

    } catch (error: any) {
      toast.error("Error actualizando el evento");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!evento)
    return <p className="p-10 text-center">Cargando evento…</p>;

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <main className="flex-1 p-8">

        <h1 className="text-3xl font-bold mb-4">Editar Evento</h1>

        <Card className="max-w-3xl shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Información del Evento
            </CardTitle>
            <CardDescription>
              Modifica la información y guarda cambios.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Título */}
              <div className="space-y-2">
                <Label htmlFor="titulo">Título</Label>
                <Input
                  id="titulo"
                  name="titulo"
                  defaultValue={evento.titulo}
                  required
                />
              </div>

              {/* Descripción */}
              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  name="descripcion"
                  defaultValue={evento.descripcion}
                  rows={5}
                  required
                />
              </div>

              {/* Fechas */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha inicio</Label>
                  <Input
                    type="datetime-local"
                    name="fecha_inicio"
                    defaultValue={evento.fecha_inicio.slice(0, 16)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Fecha fin</Label>
                  <Input
                    type="datetime-local"
                    name="fecha_fin"
                    defaultValue={evento.fecha_fin.slice(0, 16)}
                    required
                  />
                </div>
              </div>

              {/* Aforo + Categoría */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Aforo</Label>
                  <Input
                    type="number"
                    name="aforo"
                    defaultValue={evento.aforo}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Categoría</Label>
                  <Select
                    value={category}
                    onValueChange={setCategory}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map((c) => (
                        <SelectItem key={c.id} value={c.id.toString()}>
                          {c.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Ubicación */}
              <div className="space-y-2">
                <Label>Ubicación</Label>
                <Input
                  name="ubicacion"
                  defaultValue={evento.ubicacion}
                  required
                />
              </div>

              {/* Imagen */}
              <div className="space-y-2">
                <Label>Imagen (opcional)</Label>
                <Input type="file" name="foto" />
                <p className="text-xs text-muted-foreground">
                  Si no subes nueva imagen, se mantiene la actual.
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={loading} className="flex-1 gradient-primary text-white">
                  Guardar cambios
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/dashboard/search")}
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

export default EditEvent;
