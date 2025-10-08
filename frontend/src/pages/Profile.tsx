import Sidebar from "@/components/layout/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Save } from "lucide-react";
import { toast } from "sonner";

const Profile = () => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Perfil actualizado exitosamente");
  };

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      
      <main className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Mi Perfil</h1>
          <p className="text-muted-foreground">
            Administra tu información personal
          </p>
        </div>

        <div className="max-w-2xl">
          <Card className="shadow-card mb-6">
            <CardHeader>
              <CardTitle>Foto de perfil</CardTitle>
              <CardDescription>
                Actualiza tu imagen de perfil
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src="" alt="Profile" />
                <AvatarFallback className="text-2xl gradient-primary text-white">
                  JD
                </AvatarFallback>
              </Avatar>
              <div className="flex gap-3">
                <Button variant="outline" className="gap-2">
                  <Camera className="h-4 w-4" />
                  Cambiar foto
                </Button>
                <Button variant="ghost">Eliminar</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Información Personal</CardTitle>
              <CardDescription>
                Actualiza tus datos personales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Nombre</Label>
                    <Input
                      id="firstName"
                      placeholder="Juan"
                      defaultValue="Juan"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Apellido</Label>
                    <Input
                      id="lastName"
                      placeholder="Pérez"
                      defaultValue="Pérez"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="juan.perez@universidad.edu"
                    defaultValue="juan.perez@universidad.edu"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="career">Carrera</Label>
                  <Input
                    id="career"
                    placeholder="Ingeniería de Sistemas"
                    defaultValue="Ingeniería de Sistemas"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="faculty">Facultad</Label>
                  <Input
                    id="faculty"
                    placeholder="Facultad de Ingeniería"
                    defaultValue="Facultad de Ingeniería"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interests">Intereses</Label>
                  <Input
                    id="interests"
                    placeholder="Tecnología, Deportes, Arte..."
                    defaultValue="Tecnología, Deportes"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Biografía</Label>
                  <Textarea
                    id="bio"
                    placeholder="Cuéntanos sobre ti..."
                    rows={4}
                    defaultValue="Estudiante de Ingeniería apasionado por la tecnología y el emprendimiento."
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full gradient-primary text-white border-0 gap-2"
                >
                  <Save className="h-4 w-4" />
                  Guardar cambios
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Profile;
