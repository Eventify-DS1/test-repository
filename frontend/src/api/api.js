import axios from 'axios'
import { refreshTokenRequest } from './auth.js';

// En desarrollo: usa ruta relativa para el proxy de Vite
// En producción: usa la URL completa del backend o ruta relativa si están en el mismo dominio
const getBaseURL = () => {
  // Si estamos en desarrollo, usa ruta relativa (el proxy de Vite lo maneja)
  if (import.meta.env.DEV) {
    return '/api';
  }
  // En producción, usa variable de entorno o ruta relativa
  return import.meta.env.VITE_API_URL || '/api';
};

const apiClient = axios.create({
    baseURL: getBaseURL(),
    withCredentials: true
});

apiClient.interceptors.request.use((config) => {
  const csrfToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('csrftoken='))
    ?.split('=')[1];
  
  if (csrfToken) {
    config.headers['X-CSRFToken'] = csrfToken;
  }
  
  return config;
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

    // Verificar si hay un token de refresh en las cookies antes de intentar refrescar
    const hasRefreshToken = document.cookie
      .split('; ')
      .some(row => row.startsWith('refresh='));

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
        // Intentar refrescar el token (las cookies se actualizan automáticamente)
        await refreshTokenRequest();
        processQueue(null);
        // Reintentar la petición original (las cookies ya están actualizadas)
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Si el refresh falla, redirigir al login solo si no estamos ya en login
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Si es un 401 pero no hay token de refresh, simplemente rechazar el error
    // Esto permite que las peticiones públicas funcionen correctamente
    return Promise.reject(error);
  }
);

export default apiClient;