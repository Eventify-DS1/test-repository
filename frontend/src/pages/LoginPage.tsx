import React, { useState } from 'react';
import { loginRequest, resendMFACodeRequest, passwordResetRequest, passwordResetVerify, passwordResetConfirm } from '../api/auth.js';
import { useNavigate, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Loader2, Mail, ArrowLeft, Lock, Eye, EyeOff } from 'lucide-react';
import Header from '@/components/layout/Header';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resendingCode, setResendingCode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Estados para recuperación de contraseña
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSessionId, setResetSessionId] = useState(null);
  const [resetCode, setResetCode] = useState('');
  const [resetCodeVerified, setResetCodeVerified] = useState(false);
  const [emailMasked, setEmailMasked] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPassword2, setNewPassword2] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await loginRequest(username, password, mfaCode, sessionId);
      
      // Verificar si se requiere MFA
      if (response.data.mfa_required && !mfaCode) {
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
        // Login exitoso - invalidar el caché de currentUser para que se actualice
        queryClient.invalidateQueries({ queryKey: ["currentUser"] });
        navigate('/dashboard');
      }
    } catch (err) {
      console.error(err);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
        // Si el error es por código MFA incorrecto, mantener en paso MFA
        if (mfaRequired && err.response.data.error.includes('código')) {
          setMfaCode(''); // Limpiar el código para nuevo intento
        } else if (err.response.data.error.includes('Demasiados intentos')) {
          // Si hay demasiados intentos, volver al paso inicial
          setMfaRequired(false);
          setSessionId(null);
          setMfaCode('');
        }
      } else {
        setError('Usuario o contraseña incorrectos.');
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

  const handleBackToLogin = () => {
    setMfaRequired(false);
    setSessionId(null);
    setMfaCode('');
    setError(null);
  };

  // Funciones para recuperación de contraseña
  const handlePasswordResetRequest = async (e) => {
    e.preventDefault();
    setError(null);
    setResetLoading(true);

    try {
      const response = await passwordResetRequest(resetEmail);
      if (response.data.session_id) {
        setResetSessionId(response.data.session_id);
        // Si el código viene en la respuesta (modo desarrollo), mostrarlo
        if (response.data.codigo) {
          setError(`⚠️ Modo desarrollo: Tu código de recuperación es ${response.data.codigo}`);
        } else if (!response.data.email_sent) {
          setError('⚠️ No se pudo enviar el código por email. Verifica la configuración de email.');
        } else {
          setError(null);
        }
      }
    } catch (err) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Error al solicitar recuperación de contraseña. Intenta nuevamente.');
      }
    } finally {
      setResetLoading(false);
    }
  };

  const handlePasswordResetVerify = async (e) => {
    e.preventDefault();
    setError(null);
    setResetLoading(true);

    try {
      const response = await passwordResetVerify(resetSessionId, resetCode);
      if (response.data.verified) {
        setResetCodeVerified(true);
        setEmailMasked(response.data.email_masked);
        setError(null);
      }
    } catch (err) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
        if (err.response.data.error.includes('Demasiados intentos')) {
          // Volver al paso inicial
          setResetSessionId(null);
          setResetCode('');
        }
      } else {
        setError('Código incorrecto. Intenta nuevamente.');
      }
    } finally {
      setResetLoading(false);
    }
  };

  const handlePasswordResetConfirm = async (e) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== newPassword2) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (newPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setResetLoading(true);

    try {
      const response = await passwordResetConfirm(resetSessionId, resetCode, newPassword, newPassword2);
      if (response.data.detail) {
        alert('Contraseña cambiada exitosamente. Ya puedes iniciar sesión.');
        // Volver al login
        setShowPasswordReset(false);
        setResetEmail('');
        setResetSessionId(null);
        setResetCode('');
        setResetCodeVerified(false);
        setNewPassword('');
        setNewPassword2('');
        setEmailMasked('');
      }
    } catch (err) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Error al cambiar la contraseña. Intenta nuevamente.');
      }
    } finally {
      setResetLoading(false);
    }
  };

  const handleBackToPasswordReset = () => {
    setResetCodeVerified(false);
    setResetCode('');
    setNewPassword('');
    setNewPassword2('');
    setError(null);
  };

  const handleBackToLoginFromReset = () => {
    setShowPasswordReset(false);
    setResetEmail('');
    setResetSessionId(null);
    setResetCode('');
    setResetCodeVerified(false);
    setNewPassword('');
    setNewPassword2('');
    setEmailMasked('');
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-muted/50 via-background to-primary/5">
        <Card className="w-full max-w-md shadow-2xl border-primary/20">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary">
                <Calendar className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Bienvenido de nuevo
            </CardTitle>
            <CardDescription className="text-base">
              Inicia sesión en tu cuenta de Eventify
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {showPasswordReset ? (
              // Flujo de recuperación de contraseña
              !resetSessionId ? (
                // Paso 1: Solicitar código de recuperación
                <form onSubmit={handlePasswordResetRequest} className="space-y-4">
                  <div className="text-center mb-4">
                    <Lock className="h-12 w-12 mx-auto text-primary mb-2" />
                    <CardTitle className="text-xl">Recuperar Contraseña</CardTitle>
                    <CardDescription className="mt-2">
                      Ingresa tu correo electrónico y te enviaremos un código de recuperación.
                    </CardDescription>
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="resetEmail" className="text-base font-medium">
                      Correo Electrónico
                    </Label>
                    <Input
                      id="resetEmail"
                      type="email"
                      placeholder="tu@email.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value.toLowerCase())}
                      required
                      disabled={resetLoading}
                      className="h-12 text-base"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 text-base gradient-primary text-white border-0 hover:opacity-90 transition-all"
                    disabled={resetLoading}
                  >
                    {resetLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Enviando código...
                      </>
                    ) : (
                      'Enviar Código de Recuperación'
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleBackToLoginFromReset}
                    disabled={resetLoading}
                    className="w-full"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver al inicio de sesión
                  </Button>
                </form>
              ) : !resetCodeVerified ? (
                // Paso 2: Verificar código y mostrar email parcial
                <form onSubmit={handlePasswordResetVerify} className="space-y-4">
                  <div className="text-center mb-4">
                    <Mail className="h-12 w-12 mx-auto text-primary mb-2" />
                    <CardTitle className="text-xl">Verificar Código</CardTitle>
                    <CardDescription className="mt-2">
                      Hemos enviado un código de recuperación a tu email.
                      Ingresa el código para continuar.
                    </CardDescription>
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="resetCode" className="text-base font-medium">
                      Código de Recuperación
                    </Label>
                    <Input
                      id="resetCode"
                      type="text"
                      placeholder="000000"
                      value={resetCode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setResetCode(value);
                      }}
                      required
                      disabled={resetLoading}
                      className="h-12 text-base text-center text-2xl tracking-widest font-mono"
                      maxLength={6}
                      autoFocus
                    />
                    <p className="text-xs text-muted-foreground text-center">
                      Ingresa el código de 6 dígitos que recibiste por email
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 text-base gradient-primary text-white border-0 hover:opacity-90 transition-all"
                    disabled={resetLoading || resetCode.length !== 6}
                  >
                    {resetLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Verificando...
                      </>
                    ) : (
                      'Verificar Código'
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleBackToPasswordReset}
                    disabled={resetLoading}
                    className="w-full"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver
                  </Button>
                </form>
              ) : (
                // Paso 3: Cambiar contraseña
                <form onSubmit={handlePasswordResetConfirm} className="space-y-4">
                  <div className="text-center mb-4">
                    <Lock className="h-12 w-12 mx-auto text-primary mb-2" />
                    <CardTitle className="text-xl">Nueva Contraseña</CardTitle>
                    <CardDescription className="mt-2">
                      Código verificado para: <strong>{emailMasked}</strong>
                    </CardDescription>
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-base font-medium">
                      Nueva Contraseña
                    </Label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="Mínimo 8 caracteres"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      disabled={resetLoading}
                      className="h-12 text-base"
                      minLength={8}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword2" className="text-base font-medium">
                      Confirmar Nueva Contraseña
                    </Label>
                    <Input
                      id="newPassword2"
                      type="password"
                      placeholder="Repite la contraseña"
                      value={newPassword2}
                      onChange={(e) => setNewPassword2(e.target.value)}
                      required
                      disabled={resetLoading}
                      className="h-12 text-base"
                      minLength={8}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 text-base gradient-primary text-white border-0 hover:opacity-90 transition-all"
                    disabled={resetLoading || newPassword !== newPassword2 || newPassword.length < 8}
                  >
                    {resetLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Cambiando contraseña...
                      </>
                    ) : (
                      'Cambiar Contraseña'
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleBackToPasswordReset}
                    disabled={resetLoading}
                    className="w-full"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver
                  </Button>
                </form>
              )
            ) : !mfaRequired ? (
              // Paso 1: Login con credenciales
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
                    type="text"
                    placeholder="Ingresa tu usuario"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={loading}
                    className="h-12 text-base"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-base font-medium">
                    Contraseña
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Ingresa tu contraseña"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      className="h-12 text-base pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      disabled={loading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
                
                <Button
                  type="submit"
                  className="w-full h-12 text-base gradient-primary text-white border-0 hover:opacity-90 transition-all"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Iniciando sesión...
                    </>
                  ) : (
                    'Iniciar sesión'
                  )}
                </Button>
                
                <div className="space-y-2">
                  <div className="text-center text-sm text-muted-foreground">
                    ¿No tienes una cuenta?{' '}
                    <Link to="/register" className="text-primary font-semibold hover:underline">
                      Regístrate aquí
                    </Link>
                  </div>
                  <div className="text-center">
                    <Button
                      type="button"
                      variant="link"
                      onClick={() => setShowPasswordReset(true)}
                      className="text-sm text-muted-foreground hover:text-primary"
                    >
                      ¿Olvidaste tu contraseña?
                    </Button>
                  </div>
                </div>
              </form>
            ) : (
              // Paso 2: Verificación MFA
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="text-center mb-4">
                  <Mail className="h-12 w-12 mx-auto text-primary mb-2" />
                  <CardTitle className="text-xl">Verificación de Seguridad</CardTitle>
                  <CardDescription className="mt-2">
                    Hemos enviado un código de verificación de 6 dígitos a tu email.
                    Por favor, ingrésalo a continuación.
                  </CardDescription>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {!error && (
                  <Alert>
                    <AlertDescription>
                      Revisa tu bandeja de entrada (y spam) para encontrar el código.
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="mfaCode" className="text-base font-medium">
                    Código de Verificación
                  </Label>
                  <Input
                    id="mfaCode"
                    type="text"
                    placeholder="000000"
                    value={mfaCode}
                    onChange={(e) => {
                      // Solo permitir números y máximo 6 dígitos
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setMfaCode(value);
                    }}
                    required
                    disabled={loading}
                    className="h-12 text-base text-center text-2xl tracking-widest font-mono"
                    maxLength={6}
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    Ingresa el código de 6 dígitos que recibiste por email
                  </p>
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
                    'Verificar Código'
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
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Reenviar código
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleBackToLogin}
                    disabled={loading}
                    className="w-full"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver al inicio de sesión
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default LoginPage;
