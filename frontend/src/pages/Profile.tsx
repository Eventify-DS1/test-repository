import Sidebar from "@/components/layout/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUserRequest, updateCurrentUserRequest } from "@/api/users";
import { refreshTokenRequest } from "@/api/auth";
import { getImageUrl } from "@/utils/imageHelpers";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useQueryClient } from "@tanstack/react-query";

interface Usuario {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  carrera: string;
  facultad: string;
  codigo_estudiantil: string;
  foto: string | null;
  rol_data: {
    id: number;
    nombre: string;
  };
}

const Profile = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: usuario, isLoading: loading, refetch: refetchUser } = useCurrentUser();
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    carrera: '',
    facultad: '',
    codigo_estudiantil: '',
  });

  // Actualizar formData cuando el usuario se carga o cambia
  useEffect(() => {
    if (usuario) {
    setFormData({
        first_name: usuario.first_name || '',
        last_name: usuario.last_name || '',
        email: usuario.email || '',
        carrera: usuario.carrera || '',
        facultad: usuario.facultad || '',
        codigo_estudiantil: usuario.codigo_estudiantil || '',
    });
    }
  }, [usuario]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const updatePerfil = async (data: typeof formData, isRetry = false): Promise<void> => {
    try {
      const response = await updateCurrentUserRequest(data);
      const updatedUser = response.data?.usuario || response.data;
      
      // Actualizar el caché de React Query con los nuevos datos
      queryClient.setQueryData(["currentUser"], updatedUser);
      
      // También hacer un refetch para asegurar que tenemos los datos más recientes
      await refetchUser();
      
      toast.success(response.data?.message || 'Perfil actualizado exitosamente');
    } catch (error) {
      const status = (error as any)?.response?.status;

      if (status === 401 && !isRetry) {
        try {
          await refreshTokenRequest();
          await updatePerfil(data, true);
          return;
        } catch (refreshError) {
          console.error('Error al refrescar token:', refreshError);
        }
      }

      console.error('Error al actualizar perfil:', error);
      const errorData = (error as any)?.response?.data;
      if (errorData) {
        const errorMessage = Object.values(errorData).flat().join(', ') || 'Error al actualizar el perfil';
        toast.error(errorMessage);
      } else {
        toast.error('Error al actualizar el perfil');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await updatePerfil(formData);
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecciona un archivo de imagen válido');
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no puede ser mayor a 5MB');
      return;
    }

    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('foto', file);

      const response = await updateCurrentUserRequest(formData);
      const updatedUser = response.data?.usuario || response.data;
      
      // Actualizar el caché de React Query
      queryClient.setQueryData(["currentUser"], updatedUser);
      await refetchUser();
      
      toast.success('Foto de perfil actualizada exitosamente');
    } catch (error: any) {
      console.error('Error al actualizar foto:', error);
      const errorMessage = error?.response?.data?.foto?.[0] || 
                          error?.response?.data?.detail || 
                          'Error al actualizar la foto de perfil';
      toast.error(errorMessage);
    } finally {
      setUploadingPhoto(false);
      // Limpiar el input para permitir seleccionar el mismo archivo de nuevo
      e.target.value = '';
    }
  };

  const handleDeletePhoto = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar tu foto de perfil?')) {
      return;
    }

    setUploadingPhoto(true);
    try {
      // Enviar null para eliminar la foto
      const response = await updateCurrentUserRequest({ foto: null });
      const updatedUser = response.data?.usuario || response.data;
      
      // Actualizar el caché de React Query
      queryClient.setQueryData(["currentUser"], updatedUser);
      await refetchUser();
      
      toast.success('Foto de perfil eliminada exitosamente');
    } catch (error: any) {
      console.error('Error al eliminar foto:', error);
      toast.error('Error al eliminar la foto de perfil');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const getInitials = () => {
    if (usuario) {
      const first = usuario.first_name?.charAt(0) || '';
      const last = usuario.last_name?.charAt(0) || '';
      return (first + last).toUpperCase() || usuario.username.charAt(0).toUpperCase();
    }
    return 'U';
  };

  if (loading) {
    return (
      <div className="flex min-h-screen w-full">
        <Sidebar />
        <main className="flex-1 p-8 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Cargando perfil...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      
      <main className="flex-1 p-8">
        <div className="mb-8 space-y-3">
          <h1 className="text-3xl font-bold">Mi Perfil</h1>
          <p className="text-muted-foreground">
            Administra tu información personal
          </p>
          {usuario?.rol_data && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <span className="h-2 w-2 rounded-full bg-primary"></span>
              Rol asignado: {usuario.rol_data.nombre}
            </div>
          )}
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
                <AvatarImage src={usuario?.foto ? getImageUrl(usuario.foto) : undefined} alt="Profile" />
                <AvatarFallback className="text-2xl gradient-primary text-white">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex gap-3">
                <label htmlFor="photo-upload">
                  <Button 
                    variant="outline" 
                    className="gap-2 cursor-pointer" 
                    disabled={uploadingPhoto}
                    asChild
                  >
                    <span>
                  <Camera className="h-4 w-4" />
                      {uploadingPhoto ? 'Subiendo...' : 'Cambiar foto'}
                    </span>
                  </Button>
                </label>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                  disabled={uploadingPhoto}
                />
                {usuario?.foto && (
                  <Button 
                    variant="ghost" 
                    onClick={handleDeletePhoto}
                    disabled={uploadingPhoto}
                  >
                    Eliminar
                </Button>
                )}
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
                    <Label htmlFor="first_name">Nombre</Label>
                    <Input
                      id="first_name"
                      name="first_name"
                      placeholder="Tu nombre"
                      value={formData.first_name}
                      onChange={handleChange}
                      disabled={saving}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="last_name">Apellido</Label>
                    <Input
                      id="last_name"
                      name="last_name"
                      placeholder="Tu apellido"
                      value={formData.last_name}
                      onChange={handleChange}
                      disabled={saving}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={saving}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="codigo_estudiantil">Código Estudiantil</Label>
                  <Input
                    id="codigo_estudiantil"
                    name="codigo_estudiantil"
                    placeholder="Tu código estudiantil"
                    value={formData.codigo_estudiantil}
                    onChange={handleChange}
                    disabled={saving}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="carrera">Carrera</Label>
                  <Input
                    id="carrera"
                    name="carrera"
                    placeholder="Tu carrera"
                    value={formData.carrera}
                    onChange={handleChange}
                    disabled={saving}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="facultad">Facultad</Label>
                  <Input
                    id="facultad"
                    name="facultad"
                    placeholder="Tu facultad"
                    value={formData.facultad}
                    onChange={handleChange}
                    disabled={saving}
                  />
                </div>

                {usuario && (
                  <div className="space-y-2">
                    <Label>Rol</Label>
                    <Input
                      value={usuario.rol_data?.nombre || 'N/A'}
                      readOnly
                      disabled
                      className="bg-muted"
                    />
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full gradient-primary text-white border-0 gap-2"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Guardar cambios
                    </>
                  )}
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
