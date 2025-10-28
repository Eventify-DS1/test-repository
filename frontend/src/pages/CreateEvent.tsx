import Sidebar from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Upload } from "lucide-react";
import { toast } from "sonner";

const CreateEvent = () => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("¡Evento creado exitosamente!");
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
            <CardDescription>
              Todos los campos son obligatorios
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Título del evento</Label>
                <Input
                  id="title"
                  placeholder="Ej: Workshop de Inteligencia Artificial"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  placeholder="Describe tu evento, qué se hará, qué se aprenderá..."
                  rows={5}
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateStart">Fecha de inicio</Label>
                  <Input type="date" id="dateStart" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateEnd">Fecha de fin</Label>
                  <Input type="date" id="dateEnd" required />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="capacity">Aforo máximo</Label>
                  <Input
                    type="number"
                    id="capacity"
                    placeholder="100"
                    min="1"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Categoría</Label>
                  <Select required>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="academico">Académico</SelectItem>
                      <SelectItem value="deportivo">Deportivo</SelectItem>
                      <SelectItem value="cultural">Cultural</SelectItem>
                      <SelectItem value="social">Social</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Ubicación</Label>
                <Input
                  id="location"
                  placeholder="Ej: Auditorio Principal"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">Imagen del evento (opcional)</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" className="gap-2">
                    <Upload className="h-4 w-4" />
                    Subir
                  </Button>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  className="flex-1 gradient-primary text-white border-0"
                >
                  Publicar evento
                </Button>
                <Button type="button" variant="outline">
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
