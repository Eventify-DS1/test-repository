import apiClient from "./api";

// Función para el endpoint de registro
export const registerRequest = (userData) => {
    return apiClient.post('/users-utils/usuarios/', userData);
};

// Función para el endpoint de login (puede requerir MFA)
export const loginRequest = (username, password, mfaCode = null, sessionId = null) => {
    const data = mfaCode && sessionId 
        ? { mfa_code: mfaCode, session_id: sessionId }
        : { username, password };
    return apiClient.post('/users-utils/login/', data);
};

// Función para reenviar código MFA
export const resendMFACodeRequest = (sessionId) => {
    return apiClient.post('/users-utils/mfa/resend/', {
        session_id: sessionId
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

// Funciones para recuperación de contraseña
export const passwordResetRequest = (email) => {
  return apiClient.post('/users-utils/password-reset/request/', { email });
};

export const passwordResetVerify = (sessionId, codigo) => {
  return apiClient.post('/users-utils/password-reset/verify/', { 
    session_id: sessionId, 
    codigo 
  });
};

export const passwordResetConfirm = (sessionId, codigo, newPassword, newPassword2) => {
  return apiClient.post('/users-utils/password-reset/confirm/', {
    session_id: sessionId,
    codigo,
    new_password: newPassword,
    new_password2: newPassword2
  });
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