
import apiClient from "./apiClient";

export const getSales = () => apiClient.get("/api/sales");
export const createSale = (data) => apiClient.post("/api/sales", data);