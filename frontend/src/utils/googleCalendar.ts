/**
 * Genera un enlace de Google Calendar para añadir un evento
 * @param event - Datos del evento
 * @returns URL de Google Calendar
 */
export interface GoogleCalendarEvent {
  title: string;
  description?: string;
  location?: string;
  startDate: string; // ISO string format
  endDate: string; // ISO string format
}

export const generateGoogleCalendarLink = (event: GoogleCalendarEvent): string => {
  // Formatear fechas para Google Calendar (YYYYMMDDTHHmmssZ)
  const formatDateForGoogle = (dateString: string): string => {
    const date = new Date(dateString);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');
    return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
  };

  const startDate = formatDateForGoogle(event.startDate);
  const endDate = formatDateForGoogle(event.endDate);

  // Construir la URL base
  const baseUrl = 'https://calendar.google.com/calendar/render';
  
  // Parámetros
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${startDate}/${endDate}`,
  });

  if (event.description) {
    params.append('details', event.description);
  }

  if (event.location) {
    params.append('location', event.location);
  }

  return `${baseUrl}?${params.toString()}`;
};
