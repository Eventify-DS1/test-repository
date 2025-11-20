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