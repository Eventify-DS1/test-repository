import apiClient from "./api";

// Obtener todas las categorías
export const getCategorysRequest = () => {
    return apiClient.get('/events-utils/categorias/');
};

// Obtener el conteo de categorías
export const getCategoriesCountRequest = () => {
    return apiClient.get('/events-utils/categorias/count_categories/');
};

// Obtener una categoría por ID
export const getCategoryByIdRequest = (id) => {
    return apiClient.get(`/events-utils/categorias/${id}/`);
};