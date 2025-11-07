import React, { useState, useEffect } from 'react';
import { registerRequest, getRolesRequest } from '../api/auth.js';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, UserPlus } from 'lucide-react';
import Header from '@/components/layout/Header';

function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    carrera: '',
    facultad: '',
    codigo_estudiantil: '',
    password: '',
    password2: '',
    rol: '1'
  });
  const [roles, setRoles] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const navigate = useNavigate();

  // Cargar roles al montar el componente
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await getRolesRequest();
        const rolesData = response.data.results || response.data;
        const rolesArray = Array.isArray(rolesData) ? rolesData : [];
        setRoles(rolesArray);
        if (rolesArray.length > 0) {
          setFormData((prev) => ({
            ...prev,
            rol: rolesArray[0].id.toString()
          }));
        }
      } catch (err) {
        console.error('Error al cargar roles:', err);
        const fallbackRoles = [
          { id: 1, nombre: 'Estudiante' },
          { id: 2, nombre: 'Profesor' },
          { id: 3, nombre: 'Admin' }
        ];
        setRoles(fallbackRoles);
        setFormData((prev) => ({
          ...prev,
          rol: fallbackRoles[0].id.toString()
        }));
      } finally {
        setLoadingRoles(false);
      }
    };

    fetchRoles();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSelectChange = (value) => {
    setFormData({
      ...formData,
      rol: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validación de contraseñas
    if (formData.password !== formData.password2) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (formData.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setLoading(true);

    try {
      const dataToSend = {
        username: formData.username,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        carrera: formData.carrera,
        facultad: formData.facultad,
        codigo_estudiantil: formData.codigo_estudiantil,
        password: formData.password,
        password2: formData.password2,
        rol: Number(formData.rol)
      };

      const response = await registerRequest(dataToSend);
      console.log(response.data);
      navigate('/dashboard');
    } catch (err) {
      console.error(err.response?.data);
      const errorData = err.response?.data;
      
      if (errorData?.username) {
        setError(`Usuario: ${Array.isArray(errorData.username) ? errorData.username[0] : errorData.username}`);
      } else if (errorData?.email) {
        setError(`Email: ${Array.isArray(errorData.email) ? errorData.email[0] : errorData.email}`);
      } else if (errorData?.password) {
        setError(`Contraseña: ${Array.isArray(errorData.password) ? errorData.password[0] : errorData.password}`);
      } else if (errorData?.rol) {
        setError(`Rol: ${Array.isArray(errorData.rol) ? errorData.rol[0] : errorData.rol}`);
      } else if (errorData?.codigo_estudiantil) {
        setError(`Código Estudiantil: ${Array.isArray(errorData.codigo_estudiantil) ? errorData.codigo_estudiantil[0] : errorData.codigo_estudiantil}`);
      } else {
        setError('Error al registrar. Inténtalo de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-muted/50 via-background to-primary/5">
        <Card className="w-full max-w-md shadow-2xl border-primary/20">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary">
                <UserPlus className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Únete a Eventify
            </CardTitle>
            <CardDescription className="text-base">
              Crea tu cuenta y comienza a vivir la experiencia universitaria
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="username" className="text-base font-medium">
                  Usuario
                </Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Elige un nombre de usuario"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="h-12 text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="first_name" className="text-base font-medium">
                  Nombre
                </Label>
                <Input
                  id="first_name"
                  name="first_name"
                  type="text"
                  placeholder="Tu nombre"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="h-12 text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name" className="text-base font-medium">
                  Apellido
                </Label>
                <Input
                  id="last_name"
                  name="last_name"
                  type="text"
                  placeholder="Tu apellido"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="h-12 text-base"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-base font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="h-12 text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="carrera" className="text-base font-medium">
                  Carrera
                </Label>
                <Input
                  id="carrera"
                  name="carrera"
                  type="text"
                  placeholder="Tu carrera"
                  value={formData.carrera}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="h-12 text-base"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="facultad" className="text-base font-medium">
                  Facultad
                </Label>
                <Input
                  id="facultad"
                  name="facultad"
                  type="text"
                  placeholder="Tu facultad"
                  value={formData.facultad}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="h-12 text-base"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="codigo_estudiantil" className="text-base font-medium">
                  Código Estudiantil
                </Label>
                <Input
                  id="codigo_estudiantil"
                  name="codigo_estudiantil"
                  type="text"
                  placeholder="Tu código estudiantil"
                  value={formData.codigo_estudiantil}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="h-12 text-base"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-base font-medium">
                  Contraseña
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="h-12 text-base"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password2" className="text-base font-medium">
                  Confirmar Contraseña
                </Label>
                <Input
                  id="password2"
                  name="password2"
                  type="password"
                  placeholder="Repite tu contraseña"
                  value={formData.password2}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="h-12 text-base"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="rol" className="text-base font-medium">
                  Rol
                </Label>
                <Select
                  value={formData.rol}
                  onValueChange={handleSelectChange}
                  disabled={loading || loadingRoles}
                >
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder={loadingRoles ? 'Cargando roles...' : 'Selecciona tu rol'} />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((rol) => (
                      <SelectItem key={rol.id} value={rol.id.toString()}>
                        {rol.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button
                type="submit"
                className="w-full h-12 text-base gradient-primary text-white border-0 hover:opacity-90 transition-all"
                disabled={loading || loadingRoles}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creando cuenta...
                  </>
                ) : (
                  'Crear cuenta'
                )}
              </Button>
              
              <div className="text-center text-sm text-muted-foreground">
                ¿Ya tienes una cuenta?{' '}
                <Link to="/login" className="text-primary font-semibold hover:underline">
                  Inicia sesión aquí
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default RegisterPage;
