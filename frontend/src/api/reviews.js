import apiClient from "./api";

// Obtener reseñas de un evento
export const getEventReviewsRequest = (eventId) => {
    return apiClient.get(`/events-utils/resenas/`, {
        params: {
            evento: eventId
        }
    });
};

// Obtener reseñas del usuario autenticado
export const getUserReviewsRequest = () => {
    return apiClient.get(`/events-utils/resenas/`, {
        params: {
            mis_reseñas: 'true'
        }
    });
};

// Obtener eventos que el usuario puede calificar
export const getRateableEventsRequest = () => {
    return apiClient.get(`/events-utils/resenas/eventos_calificables/`);
};

// Crear una reseña
export const createReviewRequest = (data) => {
    return apiClient.post(`/events-utils/resenas/`, data);
};

// Actualizar una reseña
export const updateReviewRequest = (reviewId, data) => {
    return apiClient.patch(`/events-utils/resenas/${reviewId}/`, data);
};

// Eliminar una reseña
export const deleteReviewRequest = (reviewId) => {
    return apiClient.delete(`/events-utils/resenas/${reviewId}/`);
};

// Obtener promedio de calificaciones de un evento
export const getEventAverageRatingRequest = (eventId) => {
    return apiClient.get(`/events-utils/resenas/${eventId}/promedio_calificacion/`);
};