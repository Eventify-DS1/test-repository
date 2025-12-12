import apiClient from "./api";

/**
 * Obtener todas las notificaciones del usuario autenticado
 * @param {Object} params - Parámetros opcionales (search, ordering, page, page_size, etc.)
 * @param {number} params.page - Número de página (por defecto: 1)
 * @param {number} params.page_size - Tamaño de página (por defecto: 10)
 * @returns {Promise} - Respuesta con las notificaciones paginadas
 */
export const getAllNotificationsRequest = (params = {}) => {
    // Valores por defecto para paginación
    const defaultParams = {
        page: 1,
        page_size: 10,
        ...params  // Los params del usuario sobrescriben los defaults
    };
    
    return apiClient.get('/notifications-utils/notificaciones/', { 
        params: defaultParams 
    });
};

/**
 * Obtener una notificación por ID
 * @param {number} id - ID de la notificación
 * @returns {Promise} - Respuesta con la notificación
 */
export const getNotificationByIdRequest = (id) => {
    return apiClient.get(`/notifications-utils/notificaciones/${id}/`);
};

/**
 * Buscar notificaciones por nombre del evento
 * @param {string} searchTerm - Término de búsqueda (nombre del evento)
 * @param {Object} additionalParams - Parámetros adicionales opcionales
 * @returns {Promise} - Respuesta con las notificaciones filtradas
 */
export const searchNotificationsByEventRequest = (searchTerm, additionalParams = {}) => {
    return apiClient.get('/notifications-utils/notificaciones/', {
        params: {
            search: searchTerm,
            ...additionalParams
        }
    });
};

/**
 * Marcar una notificación como leída
 * @param {number} id - ID de la notificación
 * @returns {Promise} - Respuesta de confirmación
 */
export const leerNotificationRequest = (id) => {
    return apiClient.patch(`/notifications-utils/notificaciones/${id}/leer/`);
};

/**
 * Obtener el conteo de notificaciones del usuario
 * @returns {Promise} - Respuesta con total, no_leidas y leidas
 */
export const getNotificationCountRequest = () => {
    return apiClient.get('/notifications-utils/notificaciones/conteo/');
};

/**
 * Eliminar una notificación del usuario
 * @param {number} id - ID de la notificación
 * @returns {Promise} - Respuesta de confirmación
 */
export const eliminarNotificationRequest = (id) => {
    return apiClient.delete(`/notifications-utils/notificaciones/${id}/eliminar/`);
};