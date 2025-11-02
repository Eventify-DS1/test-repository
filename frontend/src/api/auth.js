import apiClient from "./api";

// Función para el endpoint de registro
export const registerRequest = (userData) => {
    return apiClient.post('/users-utils/', userData);
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