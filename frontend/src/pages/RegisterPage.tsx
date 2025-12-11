import React, { useState, useEffect } from 'react';
import { registerRequest, getRolesRequest, loginRequest, resendMFACodeRequest } from '../api/auth.js';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, UserPlus, Mail, ArrowLeft } from 'lucide-react';
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
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [resendingCode, setResendingCode] = useState(false);
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
      
      // Verificar si se requiere MFA después del registro
      if (response.data.mfa_required && response.data.session_id) {
        setSessionId(response.data.session_id);
        setMfaRequired(true);
        // Si el código viene en la respuesta (modo desarrollo), mostrarlo
        if (response.data.codigo) {
          setError(`⚠️ Modo desarrollo: Tu código MFA es ${response.data.codigo}`);
        } else if (!response.data.email_sent) {
          setError('⚠️ No se pudo enviar el código por email. Verifica la configuración de email.');
        } else {
          setError(null);
        }
      } else {
        // Si no requiere MFA (no debería pasar normalmente), ir al dashboard
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Error completo:', err);
      console.error('Datos de respuesta:', err.response?.data);
      const errorData = err.response?.data;
      
      // Mapeo de nombres de campos a español
      const fieldNames = {
        'username': 'Nombre de usuario',
        'email': 'Correo electrónico',
        'password': 'Contraseña',
        'password2': 'Confirmación de contraseña',
        'rol': 'Rol',
        'codigo_estudiantil': 'Código estudiantil',
        'first_name': 'Nombre',
        'last_name': 'Apellido',
        'carrera': 'Carrera',
        'facultad': 'Facultad'
      };
      
      // Manejar errores de validación del serializer
      if (errorData) {
        // Buscar el primer error disponible
        const errorFields = ['username', 'email', 'password', 'password2', 'rol', 'codigo_estudiantil', 'first_name', 'last_name', 'carrera', 'facultad'];
        for (const field of errorFields) {
          if (errorData[field]) {
            const errorMsg = Array.isArray(errorData[field]) ? errorData[field][0] : errorData[field];
            const fieldName = fieldNames[field] || field;
            
            // Mejorar mensajes específicos
            let friendlyMessage = errorMsg;
            
            // Mensajes específicos para casos comunes
            if (errorMsg.includes('already exists') || errorMsg.includes('ya existe') || errorMsg.includes('unique')) {
              if (field === 'codigo_estudiantil') {
                friendlyMessage = 'Este código estudiantil ya está registrado. Por favor, verifica tu código o contacta al administrador.';
              } else if (field === 'email') {
                friendlyMessage = 'Este correo electrónico ya está registrado. Por favor, usa otro correo o inicia sesión.';
              } else if (field === 'username') {
                friendlyMessage = 'Este nombre de usuario ya está en uso. Por favor, elige otro nombre.';
              } else {
                friendlyMessage = `Este ${fieldName.toLowerCase()} ya está en uso.`;
              }
            } else if (errorMsg.includes('required') || errorMsg.includes('obligatorio')) {
              friendlyMessage = `El campo ${fieldName.toLowerCase()} es obligatorio.`;
            } else if (errorMsg.includes('invalid') || errorMsg.includes('inválido')) {
              friendlyMessage = `El ${fieldName.toLowerCase()} ingresado no es válido.`;
            } else if (errorMsg.includes('too short') || errorMsg.includes('muy corto')) {
              friendlyMessage = `El ${fieldName.toLowerCase()} es demasiado corto.`;
            } else if (errorMsg.includes('too long') || errorMsg.includes('muy largo')) {
              friendlyMessage = `El ${fieldName.toLowerCase()} es demasiado largo.`;
            }
            
            setError(`${fieldName}: ${friendlyMessage}`);
            return;
          }
        }
        
        // Si hay un mensaje de error general
        if (errorData.detail || errorData.error || errorData.message) {
          let generalError = errorData.detail || errorData.error || errorData.message;
          
          // Mejorar mensajes generales comunes
          if (typeof generalError === 'string') {
            if (generalError.includes('already exists') || generalError.includes('ya existe')) {
              generalError = 'Algunos de los datos ingresados ya están en uso. Por favor, verifica tu información.';
            } else if (generalError.includes('unique constraint') || generalError.includes('violates unique constraint')) {
              generalError = 'Los datos ingresados ya están registrados. Por favor, verifica tu información.';
            }
          }
          
          setError(generalError);
          return;
        }
        
        // Si hay errores no específicos, mostrar mensaje genérico
        setError('Error al registrar. Por favor, verifica todos los campos e intenta de nuevo.');
      } else {
        setError('Error al registrar. Por favor, verifica tu conexión e intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMFASubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Usar el endpoint de login con el código MFA
      const response = await loginRequest(null, null, mfaCode, sessionId);
      
      // Si el login es exitoso, navegar al dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
        // Si el error es por código MFA incorrecto, limpiar el código para nuevo intento
        if (err.response.data.error.includes('código')) {
          setMfaCode('');
        } else if (err.response.data.error.includes('Demasiados intentos')) {
          // Si hay demasiados intentos, volver al formulario de registro
          setMfaRequired(false);
          setSessionId(null);
          setMfaCode('');
        }
      } else {
        setError('Código de verificación incorrecto. Intenta nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!sessionId) return;
    
    setResendingCode(true);
    setError(null);
    
    try {
      const response = await resendMFACodeRequest(sessionId);
      // Si el código viene en la respuesta (modo desarrollo), mostrarlo
      if (response.data.codigo) {
        setError(`⚠️ Modo desarrollo: Tu código MFA es ${response.data.codigo}`);
      } else if (!response.data.email_sent) {
        setError('⚠️ No se pudo enviar el código por email. Verifica la configuración de email.');
      } else {
        setError(null);
        alert('Código reenviado. Revisa tu email.');
      }
    } catch (err) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Error al reenviar el código. Intenta nuevamente.');
      }
    } finally {
      setResendingCode(false);
    }
  };

  const handleBackToRegister = () => {
    setMfaRequired(false);
    setSessionId(null);
    setMfaCode('');
    setError(null);
  };

  // Si se requiere MFA, mostrar formulario de código MFA
  if (mfaRequired) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-muted/50 via-background to-primary/5">
          <Card className="w-full max-w-md shadow-2xl border-primary/20">
            <CardHeader className="space-y-1 text-center">
              <div className="flex justify-center mb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary">
                  <Mail className="h-8 w-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                Verificación requerida
              </CardTitle>
              <CardDescription className="text-base">
                Hemos enviado un código de verificación a tu email. Ingresa el código para completar tu registro.
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleMFASubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="mfaCode" className="text-base font-medium">
                    Código de verificación
                  </Label>
                  <Input
                    id="mfaCode"
                    type="text"
                    placeholder="000000"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    disabled={loading}
                    className="h-12 text-base text-center text-2xl tracking-widest"
                    maxLength={6}
                  />
                </div>
                
                <Button
                  type="submit"
                  className="w-full h-12 text-base gradient-primary text-white border-0 hover:opacity-90 transition-all"
                  disabled={loading || mfaCode.length !== 6}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    'Verificar código'
                  )}
                </Button>
                
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleResendCode}
                    disabled={resendingCode || loading}
                    className="w-full"
                  >
                    {resendingCode ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Reenviando...
                      </>
                    ) : (
                      'Reenviar código'
                    )}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleBackToRegister}
                    disabled={loading}
                    className="w-full"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver al registro
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
