import { useQuery } from "@tanstack/react-query";
import { getCurrentUserRequest } from "@/api/users";
import axios from "axios";

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

/**
 * Hook personalizado para obtener y cachear la información del usuario actual.
 * Usa React Query para manejar caché, revalidación y estados de carga.
 * 
 * Optimizado para cachear también el estado de "no autenticado" (401) para evitar
 * llamadas repetidas innecesarias.
 * 
 * @param options - Opciones para configurar el comportamiento del hook
 * @returns Objeto con datos del usuario, estado de carga, error y función de refetch
 */
export const useCurrentUser = (options?: {
  enabled?: boolean;
  staleTime?: number; // Tiempo en ms antes de considerar los datos "stale"
  cacheTime?: number; // Tiempo en ms antes de eliminar los datos del caché
}) => {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery<Usuario | null>({
    queryKey: ["currentUser"],
    queryFn: async () => {
      try {
        const response = await getCurrentUserRequest();
        return response.data;
      } catch (error: any) {
        // Si es un error 401 (no autenticado), retornar null en lugar de lanzar error
        // Esto permite cachear el estado de "no autenticado"
        if (error?.response?.status === 401) {
          return null;
        }
        // Para otros errores, lanzar el error normalmente
        throw error;
      }
    },
    staleTime: options?.staleTime ?? 5 * 60 * 1000, // 5 minutos por defecto
    gcTime: options?.cacheTime ?? 10 * 60 * 1000, // 10 minutos por defecto (gcTime en v5, cacheTime en v4)
    retry: (failureCount, error: any) => {
      // No reintentar si es un 401 (no autenticado) - esto es un estado válido
      if (error?.response?.status === 401) {
        return false;
      }
      // Reintentar una vez para otros errores
      return failureCount < 1;
    },
    refetchOnWindowFocus: false, // No refetch automático al enfocar la ventana
    refetchOnMount: false, // No refetch automático al montar (usa caché si está disponible)
    refetchOnReconnect: false, // No refetch automático al reconectar
    enabled: options?.enabled ?? true,
    // Cachear también el estado null (no autenticado)
    placeholderData: (previousData) => previousData,
    // Los errores 401 se manejan silenciosamente en queryFn retornando null
    // El interceptor de axios también silencia estos errores en la consola
  });

  // Type assertion para asegurar que TypeScript reconozca el tipo Usuario
  const user = data as Usuario | null | undefined;

  // Si data es null, significa que el usuario no está autenticado (401 fue manejado)
  // Si data es undefined, significa que aún está cargando o hay un error real
  const isAuthenticated = user !== undefined && user !== null;
  const isUnauthenticated = data === null; // Estado explícito de "no autenticado"

  return {
    user: user ?? null,
    isLoading,
    isError: isError && !isUnauthenticated, // Solo es error si no es un 401 (no autenticado)
    error: isUnauthenticated ? null : error, // No mostrar error si es simplemente "no autenticado"
    refetch,
    isFetching,
    // Helper para obtener el rol del usuario
    userRole: user?.rol_data?.nombre ?? null,
    // Helper para verificar si es admin
    isAdmin: user?.rol_data?.nombre?.toLowerCase() === 'admin' || 
             user?.rol_data?.nombre?.toLowerCase() === 'administrador',
    // Helper para verificar si está autenticado
    isAuthenticated,
    // Helper para verificar si explícitamente no está autenticado (401 cacheado)
    isUnauthenticated,
  };
};

