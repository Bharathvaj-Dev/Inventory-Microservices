
import apiClient from "./apiClient";

export const getInventory = () => apiClient.get("/api/inventory");
