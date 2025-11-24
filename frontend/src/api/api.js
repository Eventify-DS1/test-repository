import axios from 'axios'

const apiClient = axios.create({
    baseURL: 'http://localhost:8000/api',
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

// Interceptor de respuesta para manejar errores 401 de manera silenciosa
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Los errores 401 (Unauthorized) son esperados para usuarios no autenticados
    // No los mostramos en consola para evitar ruido
    if (error.response?.status === 401) {
      // Retornar el error pero sin loggearlo
      return Promise.reject(error);
    }
    // Para otros errores, dejarlos pasar normalmente
    return Promise.reject(error);
  }
);

export default apiClient;