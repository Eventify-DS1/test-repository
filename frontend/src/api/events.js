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

// Confirmar asistencia con código
export const confirmAttendanceRequest = (eventId, codigo) => {
    return apiClient.post(`/events-utils/eventos/${eventId}/confirmar_asistencia/`, {
        codigo: codigo
    });
};

// Confirmar asistencia solo con código (el backend busca el evento)
export const confirmAttendanceByCodeRequest = (codigo) => {
    return apiClient.post(`/events-utils/eventos/confirmar-por-codigo/`, {
        codigo: codigo
    });
};

// Obtener eventos próximos donde el usuario está inscrito
export const getUpcomingSubscribedEventsRequest = () => {
    return apiClient.get('/events-utils/eventos/eventos_proximos_inscritos/');
};

// Obtener eventos asistidos por el usuario
export const getAttendedEventsRequest = () => {
    return apiClient.get('/events-utils/eventos/eventos_asistidos/');
};

// Obtener los 3 eventos más populares (con más inscritos)
export const getPopularEventsRequest = () => {
    return apiClient.get('/events-utils/eventos/eventos_populares/');
};

// Obtener eventos creados por el usuario (donde es organizador)
export const getMyCreatedEventsRequest = () => {
    return apiClient.get('/events-utils/eventos/eventos_creados/');
};

// Obtener eventos pasados donde el usuario está inscrito
export const getPastSubscribedEventsRequest = () => {
    return apiClient.get('/events-utils/eventos/eventos_pasados_inscritos/');
};

// Obtener eventos pasados creados por el usuario
export const getPastCreatedEventsRequest = () => {
    return apiClient.get('/events-utils/eventos/eventos_pasados_creados/');
};

// Obtener todos los eventos donde el usuario está inscrito (sin filtrar por fecha)
export const getAllSubscribedEventsRequest = () => {
    return apiClient.get('/events-utils/eventos/eventos_inscritos/');
};

// Marcar evento como favorito
export const addToFavoritesRequest = (eventId) => {
    return apiClient.post(`/events-utils/eventos/${eventId}/toggle_favorito/`);
};

// Desmarcar evento como favorito
export const removeFromFavoritesRequest = (eventId) => {
    return apiClient.delete(`/events-utils/eventos/${eventId}/toggle_favorito/`);
};

// Obtener eventos favoritos del usuario
export const getFavoriteEventsRequest = () => {
    return apiClient.get('/events-utils/eventos/eventos_favoritos/');
};

// ============================================================================
// REPORTES PARA ORGANIZADORES
// ============================================================================

export const getReporteOrganizadorRequest = (eventoId) => {
  return apiClient.get(`/events-utils/eventos/${eventoId}/reporte_organizador/`);
};

export const getMisEventosReportesRequest = () => {
  return apiClient.get("/events-utils/eventos/mis_eventos_reportes/");
};


 //* Exporta el reporte de un evento a CSV
export const exportarReporteCSV = async (eventoId) => {
  try {
    const response = await getReporteOrganizadorRequest(eventoId);
    const data = response.data;
    
    // Convertir a CSV
    const headers = ['Nombre', 'Email', 'Código Estudiantil', 'Fecha Inscripción', 'Asistencia Confirmada', 'Fecha Confirmación'];
    const rows = data.inscritos.map(inscrito => [
      inscrito.nombre_completo,
      inscrito.email,
      inscrito.codigo_estudiantil || 'N/A',
      new Date(inscrito.fecha_inscripcion).toLocaleDateString(),
      inscrito.asistencia_confirmada ? 'Sí' : 'No',
      inscrito.fecha_confirmacion ? new Date(inscrito.fecha_confirmacion).toLocaleDateString() : 'N/A'
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    // Descargar archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `reporte_${data.evento.titulo}_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return response;
  } catch (error) {
    console.error('Error al exportar reporte CSV:', error);
    throw error;
  }
};

