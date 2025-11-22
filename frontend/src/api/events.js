import apiClient from "./api";

// Obtener todos los eventos con filtros opcionales
export const getEventsRequest = (params = {}) => {
    return apiClient.get('/events-utils/eventos/', { params });
};

// Obtener un evento por ID
export const getEventByIdRequest = (id) => {
    return apiClient.get(`/events-utils/eventos/${id}/`);
};

// Crear un evento
export const createEventRequest = (eventData) => {
    return apiClient.post('/events-utils/eventos/', eventData);
};

// Eliminar evento por ID
export const deleteEventRequest = (id) => {
  return apiClient.delete(`/events-utils/eventos/${id}/`);
};


//Actualizar informacion para editar evento
export const updateEventRequest = (id, data) => {
  return apiClient.put(`/events-utils/eventos/${id}/`, data, {
    headers: { "Content-Type": "multipart/form-data" }
  });
};


// Obtener eventos destacados (3 más recientes)
export const getFeaturedEventsRequest = (limit = 3) => {
    return apiClient.get('/events-utils/eventos/', {
        params: {
            page_size: limit,
            ordering: '-fecha_inicio',
        },
    });
};

// Verificar si el usuario está inscrito en un evento
export const checkInscriptionRequest = (eventId) => {
    return apiClient.get(`/events-utils/eventos/${eventId}/esta_inscrito/`);
};

// Inscribirse en un evento
export const subscribeToEventRequest = (eventId) => {
    return apiClient.post(`/events-utils/eventos/${eventId}/inscribirse/`);
};

// Desinscribirse de un evento
export const unsubscribeFromEventRequest = (eventId) => {
    return apiClient.delete(`/events-utils/eventos/${eventId}/desinscribirse/`);
};

// Obtener inscripciones del usuario actual
export const getUserInscriptionsRequest = () => {
    return apiClient.get('/events-utils/inscripciones/', {
        params: {
            // El backend filtra automáticamente por usuario autenticado
        },
    });
};