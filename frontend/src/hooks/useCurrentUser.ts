import { useQuery } from "@tanstack/react-query";
import { getCurrentUserRequest } from "@/api/users";

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
  } = useQuery<Usuario>({
    queryKey: ["currentUser"],
    queryFn: async () => {
      try {
        const response = await getCurrentUserRequest();
        return response.data;
      } catch (error: any) {
        if (error.response.status === 401) {
          return null;
        }
        throw error;
      }
    },
    staleTime: options?.staleTime ?? 5 * 60 * 1000, // 5 minutos por defecto
    gcTime: options?.cacheTime ?? 10 * 60 * 1000, // 10 minutos por defecto (gcTime en v5, cacheTime en v4)
    retry: 1, // Reintentar una vez si falla
    refetchOnWindowFocus: false, // No refetch automático al enfocar la ventana
    refetchOnMount: false, // No refetch automático al montar (usa caché si está disponible)
    enabled: options?.enabled ?? true,
  });

  // Type assertion para asegurar que TypeScript reconozca el tipo Usuario
  const user = data as Usuario | undefined;

  return {
    user: user ?? null,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
    // Helper para obtener el rol del usuario
    userRole: user?.rol_data?.nombre ?? null,
    // Helper para verificar si es admin
    isAdmin: user?.rol_data?.nombre?.toLowerCase() === 'admin' || 
             user?.rol_data?.nombre?.toLowerCase() === 'administrador',
  };
};

