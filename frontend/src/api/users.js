import apiClient from "./api";

// Obtener el contador de usuarios registrados
export const getUsersCountRequest = () => {
  return apiClient.get('/users-utils/usuarios/count_users/');
};

// Puedes agregar más funciones relacionadas con usuarios aquí
export const getUserByIdRequest = (id) => {
  return apiClient.get(`/users-utils/usuarios/${id}/`);
};

export const updateUserRequest = (id, userData) => {
  return apiClient.put(`/users-utils/usuarios/${id}/`, userData);
};

// Obtener el usuario actual autenticado
export const getCurrentUserRequest = () => {
  return apiClient.get('/users-utils/usuarios/me/');
};

// Actualizar el usuario actual
export const updateCurrentUserRequest = (userData) => {
  // Si userData es FormData, usar multipart/form-data
  const headers = userData instanceof FormData 
    ? { 'Content-Type': 'multipart/form-data' }
    : {};
  
  return apiClient.patch('/users-utils/usuarios/me/', userData, { headers });
};

// Obtener perfil público de un usuario
export const getPublicProfileRequest = (userId) => {
  return apiClient.get(`/users-utils/usuarios/${userId}/perfil_publico/`);
};