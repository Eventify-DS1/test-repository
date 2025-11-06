  import Sidebar from "@/components/layout/Sidebar";
  import { Button } from "@/components/ui/button";
  import { Input } from "@/components/ui/input";
  import { Label } from "@/components/ui/label";
  import apiClient from "@/api/api"
  import { createEventRequest } from "@/api/auth";
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
  import axios from "axios";
  import { useState, useEffect } from "react";

  const CreateEvent = () => {
    const [category, setCategory] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await apiClient.get("/auth/verify/"); // Ajusta según tu endpoint
        console.log("Usuario autenticado:", response.data);
      } catch (error) {
        console.error("No autenticado:", error);
        toast.error("Debes iniciar sesión para crear eventos");
        // Redirigir al login
      }
    };
    
    checkAuth();
  }, []);

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

    formData.append("categoria_id", category);

    console.log("=== DATOS DEL FORMULARIO ===");
    for (let [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }

    try {
      const response = await createEventRequest(formData);
      console.log("✅ Evento creado:", response.data);
      toast.success("Evento creado exitosamente");
      form.reset();
      setCategory("");
    } catch (error: any) {
      console.error("=== ERROR COMPLETO ===");
      if (error.response) {
        console.error("Status:", error.response.status);
        console.error("Data:", error.response.data);
        console.error("Headers:", error.response.headers);

        if (error.response.status === 401) {
          toast.error("No estás autenticado. Por favor inicia sesión.");
        } else if (error.response.status === 403) {
          toast.error("No tienes permisos para crear eventos.");
        } else {
          toast.error(`Error: ${JSON.stringify(error.response.data)}`);
        }
      } else if (error.request) {
        console.error("Request:", error.request);
        toast.error("No se pudo conectar con el servidor");
      } else {
        console.error("Error:", error.message);
        toast.error("Error desconocido");
      }
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
                      onKeyDown={(e) => e.preventDefault()}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fecha_fin">Fecha de fin</Label>
                    <Input
                      type="datetime-local"
                      id="fecha_fin"
                      name="fecha_fin"
                      required
                      onKeyDown={(e) => e.preventDefault()}
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
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Categoría</Label>
                    <Select
                      value={category}
                      onValueChange={setCategory}
                      required
                    >
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Selecciona una categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* ⚠️ Los values deben ser los IDs existentes en tu base de datos */}
                        <SelectItem value="1">Académico</SelectItem>
                        <SelectItem value="2">Deportivo</SelectItem>
                        <SelectItem value="3">Cultural</SelectItem>
                        <SelectItem value="4">Social</SelectItem>
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
                  />
                </div>

                {/* Imagen */}
                <div className="space-y-2">
                  <Label htmlFor="foto">Imagen del evento (opcional)</Label>
                  <Input id="foto" name="foto" type="file" accept="image/*" />
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
