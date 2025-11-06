import apiClient from "./api";

// Función para el endpoint de registro
export const registerRequest = (userData) => {
    return apiClient.post('/users-utils/usuarios/', userData);
};

// Función para el endpoint de login
export const loginRequest = (username, password) => {
    return apiClient.post('/users-utils/login/', {
        username,
        password
    });
};

// Función para el endpoint de logout
export const logoutRequest = () => {
    return apiClient.post('/users-utils/logout/');
};

// Función para verificar la sesión
export const verifyTokenRequest = () => {
    return apiClient.post('/users-utils/verify/');
};

// Función para refrescar el token de acceso
export const refreshTokenRequest = () => {
  return apiClient.post('/users-utils/refresh/');
};

// Función para obtener roles disponibles
export const getRolesRequest = () => {
  return apiClient.get('/users-utils/roles/');
};

// Funciones para estadísticas
export const getEventosStatsRequest = () => {
    return apiClient.get('/events-utils/eventos/estadisticas/');
};

export const getUsuariosStatsRequest = () => {
    return apiClient.get('/users-utils/usuarios/estadisticas/');
};

export const getCategoriasStatsRequest = () => {
    return apiClient.get('/events-utils/categorias/estadisticas/');
};

// Funciones para eventos
export const getEventosRequest = (params = {}) => {
    return apiClient.get('/events-utils/eventos/', { params });
};

export const getEventoByIdRequest = (id) => {
    return apiClient.get(`/events-utils/eventos/${id}/`);
};

// Funciones para categorías
export const getCategoriasRequest = () => {
    return apiClient.get('/events-utils/categorias/');
};