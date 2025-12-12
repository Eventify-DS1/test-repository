import Sidebar from "@/components/layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Key, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { confirmAttendanceByCodeRequest } from "@/api/events";

const ConfirmAttendance = () => {
  const [codigo, setCodigo] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmedEvent, setConfirmedEvent] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!codigo.trim()) {
      toast.error("Por favor ingresa un código de confirmación");
      return;
    }

    setIsConfirming(true);
    setConfirmedEvent(null);
    
    try {
      const response = await confirmAttendanceByCodeRequest(codigo.trim().toUpperCase());
      
      setConfirmedEvent(response.data.evento_titulo || "el evento");
      
      toast.success(
        response.data.message || "¡Asistencia confirmada exitosamente!",
        { duration: 5000 }
      );
      
      // Limpiar el código después de un delay
      setTimeout(() => {
        setCodigo("");
        setConfirmedEvent(null);
      }, 3000);
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Error al confirmar asistencia';
      toast.error(errorMessage, { duration: 5000 });
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      
      <main className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Confirmar Asistencia</h1>
          <p className="text-muted-foreground">
            Ingresa el código de confirmación que recibiste del organizador
          </p>
        </div>

        <div className="max-w-2xl">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                Código de Confirmación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Ingresa el código
                </label>
                <Input
                  type="text"
                  placeholder="Ej: ABC123"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                  maxLength={10}
                  className="text-lg uppercase tracking-widest font-mono text-center"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && codigo.trim()) {
                      handleConfirm();
                    }
                  }}
                  disabled={isConfirming}
                />
                <p className="text-xs text-muted-foreground text-center">
                  El código se convertirá automáticamente a mayúsculas
                </p>
              </div>

              {confirmedEvent && (
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-5 w-5" />
                    <p className="font-semibold">¡Confirmado exitosamente!</p>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Tu asistencia ha sido confirmada para: <strong>{confirmedEvent}</strong>
                  </p>
                </div>
              )}

              <Button
                onClick={handleConfirm}
                disabled={isConfirming || !codigo.trim()}
                className="w-full gradient-primary text-white border-0"
                size="lg"
              >
                {isConfirming ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Confirmando...
                  </>
                ) : (
                  <>
                    <Key className="mr-2 h-4 w-4" />
                    Confirmar Asistencia
                  </>
                )}
              </Button>

              <div className="pt-4 border-t">
                <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold mb-1">¿No tienes un código?</p>
                    <p className="text-xs text-muted-foreground">
                      Solicita el código de confirmación al organizador del evento. 
                      El código es único para cada evento y permite confirmar tu asistencia.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ConfirmAttendance;

