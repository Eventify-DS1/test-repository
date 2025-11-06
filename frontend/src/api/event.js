import apiClient from "./api";

export const createEventRequest = (formData) => {
  return apiClient.post("/events-utils/eventos/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
