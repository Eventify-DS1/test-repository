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

export default apiClient;