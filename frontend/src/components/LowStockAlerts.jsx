import { useCallback, useEffect, useState } from "react";
import apiClient from "../api/apiClient";

export default function LowStockAlerts() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadLowStock = useCallback(async () => {
    try {
      // The backend creates LOW_STOCK_ALERT events when stock is below 10.
      const response = await apiClient.get("/api/inventory/low-stock?threshold=9");
      setItems(Array.isArray(response.data) ? response.data : []);
      setError("");
    } catch (err) {
      setError(err.response
        ? `Unable to load low-stock data (HTTP ${err.response.status}).`
        : "Inventory Service is unavailable.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLowStock();
    const timer = setInterval(loadLowStock, 10000);
    return () => clearInterval(timer);
  }, [loadLowStock]);

  return (
    <section className="low-stock-panel" aria-live="polite">
      <div className="low-stock-card">
        <div className="low-stock-heading">
          <div>
            <h2>⚠ Low Stock Alerts</h2>
            <p>Products with fewer than 10 units · refreshes every 10 seconds</p>
          </div>
          <span className="low-stock-count">{items.length} {items.length === 1 ? "alert" : "alerts"}</span>
        </div>

        {loading && <p>Checking inventory...</p>}
        {error && <p className="low-stock-error" role="alert">{error}</p>}
        {!loading && !error && items.length === 0 && (
          <p className="low-stock-empty">✓ No low-stock products right now.</p>
        )}
        {!error && items.length > 0 && (
          <div className="low-stock-list">
            {items.map((item) => (
              <div className="low-stock-item" key={item.id ?? item.productId}>
                <div>
                  <strong>Product #{item.productId}</strong>
                  <small>Last updated: {item.lastUpdated ? new Date(item.lastUpdated).toLocaleString() : "—"}</small>
                </div>
                <span className="low-stock-quantity">{item.currentStock} left</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
