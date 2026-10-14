
import apiClient from "./apiClient";

export const getProducts = () => apiClient.get("/api/products");
export const getProductById = (id) => apiClient.get(`/api/products/${id}`);
export const createProduct = (data) => apiClient.post("/api/products", data);
export const updateProduct = (id, data) => apiClient.put(`/api/products/${id}`, data);
export const deleteProduct = (id) => apiClient.delete(`/api/products/${id}`);