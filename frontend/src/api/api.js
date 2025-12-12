import axios from 'axios'
import { refreshTokenRequest } from './auth.js';

// En desarrollo: usa ruta relativa para el proxy de Vite
// En producción: usa la URL completa del backend o ruta relativa si están en el mismo dominio
const getBaseURL = () => {
  // Si estamos en desarrollo, usa ruta relativa (el proxy de Vite lo maneja)
  if (import.meta.env.DEV) {
    return '/api';
  }
  // En producción, usa variable de entorno o fallback al backend público
  return import.meta.env.VITE_API_URL || 'https://test-repository-production-b71d.up.railway.app/api';
};

const apiClient = axios.create({
    baseURL: getBaseURL(),
    withCredentials: true
});

apiClient.interceptors.request.use((config) => {
  // Obtener token de acceso desde localStorage
  const accessToken = localStorage.getItem('access_token');
  
  if (accessToken) {
    config.headers['Authorization'] = `Bearer ${accessToken}`;
  }
  
  // CSRF ya no es necesario con Authorization header, pero lo mantenemos por compatibilidad
  const csrfToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('csrftoken='))
    ?.split('=')[1];
  
  if (csrfToken) {
    config.headers['X-CSRFToken'] = csrfToken;
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor de respuesta para manejar errores 401 y refrescar token automáticamente
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Si la petición fue cancelada, rechazar silenciosamente
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }
    
    const originalRequest = error.config;

    // URLs que NO deben intentar refrescar el token
    const skipRefreshUrls = [
      '/users-utils/login/',
      '/users-utils/refresh/',
      '/users-utils/logout/',
      '/users-utils/register/',
    ];

    // Verificar si la URL actual está en la lista de exclusión
    const shouldSkipRefresh = skipRefreshUrls.some(url => 
      originalRequest.url?.includes(url)
    );

    // Verificar si hay un token de refresh en localStorage antes de intentar refrescar
    const hasRefreshToken = !!localStorage.getItem('refresh_token');

    // Si el error es 401 y no es una petición de refresh/login/logout/register
    // Y hay un token de refresh disponible
    if (error.response?.status === 401 && !originalRequest._retry && !shouldSkipRefresh && hasRefreshToken) {
      if (isRefreshing) {
        // Si ya se está refrescando, encolar la petición
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            // No agregar headers de Authorization, el backend usa cookies
            // Las cookies se manejan automáticamente con withCredentials: true
            return apiClient(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Intentar refrescar el token
        const response = await refreshTokenRequest();
        const newAccessToken = response.data.access;
        const newRefreshToken = response.data.refresh;
        
        // Guardar nuevos tokens en localStorage
        localStorage.setItem('access_token', newAccessToken);
        if (newRefreshToken) {
          localStorage.setItem('refresh_token', newRefreshToken);
        }
        
        processQueue(null, newAccessToken);
        
        // Agregar el nuevo token al request original
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        
        // Reintentar la petición original
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Si el refresh falla, limpiar localStorage y redirigir al login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Silenciar errores 401 para rutas específicas donde es un estado válido (no autenticado)
    // Esto evita mostrar errores en la consola del navegador
    if (error.response?.status === 401) {
      const silent401Urls = [
        '/users-utils/usuarios/me/',
        '/users-utils/login/', // Los errores de login con credenciales incorrectas son esperados
      ];
      
      const shouldSilence = silent401Urls.some(url => 
        originalRequest.url?.includes(url)
      );
      
      if (shouldSilence) {
        // Crear un error personalizado que no se mostrará en la consola del navegador
        // pero que React Query puede manejar
        const silentError = new Error(error.message || 'Unauthorized');
        silentError.name = 'Silent401Error';
        // Copiar propiedades importantes del error original
        Object.assign(silentError, {
          response: error.response,
          config: error.config,
          request: error.request,
          isAxiosError: true,
        });
        return Promise.reject(silentError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;