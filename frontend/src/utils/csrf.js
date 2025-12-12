/**
 * Utilidad para obtener y manejar el token CSRF
 */
import apiClient from '../api/api';

let csrfTokenPromise = null;

/**
 * Obtiene el token CSRF del backend
 * Usa un singleton para evitar múltiples llamadas simultáneas
 */
export const fetchCSRFToken = async () => {
  // Si ya hay una petición en curso, esperar a que termine
  if (csrfTokenPromise) {
    return csrfTokenPromise;
  }

  // Crear nueva petición
  csrfTokenPromise = apiClient
    .get('/users-utils/csrf-token/')
    .then((response) => {
      // El token CSRF se establece automáticamente en las cookies
      // por el backend con ensure_csrf_cookie
      return response.data.csrf_token;
    })
    .catch((error) => {
      console.warn('No se pudo obtener el token CSRF:', error);
      // No es crítico si falla, el interceptor de axios intentará leerlo de las cookies
      return null;
    })
    .finally(() => {
      // Limpiar la promesa después de completarse
      csrfTokenPromise = null;
    });

  return csrfTokenPromise;
};

/**
 * Inicializa el token CSRF al cargar la aplicación
 */
export const initCSRFToken = () => {
  // Obtener el token CSRF al iniciar la aplicación
  fetchCSRFToken();
};

