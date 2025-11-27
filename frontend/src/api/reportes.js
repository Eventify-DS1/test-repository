import apiClient from "./api";
// === CONSULTAS === //

export function getEventosPorMes() {
  return apiClient.get('/reportes/eventos-por-mes/');
}

export function getEventosPorUsuario() {
  return apiClient.get('/reportes/eventos-por-usuario/');
}

export function getEventosPorCategoria() {
  return apiClient.get('/reportes/eventos-por-categoria/');
}

// === EXPORTACIONES === //

export function exportCSV(tipo) {
  return apiClient.get(`/reportes/${tipo}/export/csv/`, {
    responseType: 'blob'
  }).then(downloadBlob('reporte.csv'));
}

export function exportXLSX(tipo) {
  return apiClient.get(`/reportes/${tipo}/export/xlsx/`, {
    responseType: 'blob'
  }).then(downloadBlob('reporte.xlsx'));
}

export function exportPDF(tipo) {
  return apiClient.get(`/reportes/${tipo}/export/pdf/`, {
    responseType: 'blob'
  }).then(downloadBlob('reporte.pdf'));
}

// === UTILIDAD PARA DESCARGAR === //

function downloadBlob(filename) {
  return (response) => {
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };
}
