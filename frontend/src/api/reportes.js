import apiClient from "./api";


/**
 * Obtiene eventos agrupados por mes
 * @param {Object} params - Parámetros opcionales { inicio, fin }
 * @returns {Promise} Promesa con los datos
 */
export const getEventosPorMes = (params = {}) => {
  return apiClient.get("/reportes/eventos-por-mes/", { params });
};

/**
 * Obtiene eventos agrupados por usuario organizador
 * @returns {Promise} Promesa con los datos
 */
export const getEventosPorUsuario = () => {
  return apiClient.get("/reportes/eventos-por-usuarios/");
};

/**
 * Obtiene eventos agrupados por categoría
 * @returns {Promise} Promesa con los datos
 */
export const getEventosPorCategoria = () => {
  return apiClient.get("/reportes/eventos-por-categoria/");
};

/**
 * Obtiene eventos agrupados por ubicación
 * @returns {Promise} Promesa con los datos
 */
export const getEventosPorLugar = () => {
  return apiClient.get("/reportes/eventos-por-lugar/");
};

/**
 * Obtiene eventos agrupados por estado (futuro, en curso, finalizado, lleno)
 * @returns {Promise} Promesa con los datos
 */
export const getEventosPorEstado = () => {
  return apiClient.get("/reportes/eventos-por-estado/");
};

// ============================================================================
// FUNCIONES DE EXPORTACIÓN
// ============================================================================

/**
 * Descarga un archivo desde una URL blob
 * @param {Blob} blob - Blob del archivo
 * @param {String} filename - Nombre del archivo
 */
const descargarArchivo = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Exporta datos a CSV
 * @param {String} tipo - Tipo de reporte: mes, usuarios, categorias, lugares, global
 * @returns {Promise}
 */
export const exportCSV = async (tipo = "global") => {
  try {
    const response = await apiClient.get("/reportes/export/csv/", {
      params: { tipo },
      responseType: "blob",
    });
    
    descargarArchivo(response.data, `reporte_${tipo}.csv`);
    return response;
  } catch (error) {
    console.error("Error al exportar CSV:", error);
    throw error;
  }
};

/**
 * Exporta datos a Excel (XLSX)
 * @param {String} tipo - Tipo de reporte: mes, usuarios, categorias, lugares, global
 * @returns {Promise}
 */
export const exportXLSX = async (tipo = "global") => {
  try {
    const response = await apiClient.get("/reportes/export/xlsx/", {
      params: { tipo },
      responseType: "blob",
    });
    
    descargarArchivo(response.data, `reporte_${tipo}.xlsx`);
    return response;
  } catch (error) {
    console.error("Error al exportar XLSX:", error);
    throw error;
  }
};

/**
 * Exporta datos a PDF
 * @param {String} tipo - Tipo de reporte: mes, usuarios, categorias, lugares, global
 * @returns {Promise}
 */
export const exportPDF = async (tipo = "global") => {
  try {
    const response = await apiClient.get("/reportes/export/pdf/", {
      params: { tipo },
      responseType: "blob",
    });
    
    descargarArchivo(response.data, `reporte_${tipo}.pdf`);
    return response;
  } catch (error) {
    console.error("Error al exportar PDF:", error);
    throw error;
  }
};