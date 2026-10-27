import { useCallback, useEffect, useState } from "react";
import apiClient from "../api/apiClient";
import "./ArchitectureDashboard.css";

const SERVICES = [
  { key: "product-service", name: "Product Service", port: 8081, description: "Product and category management", icon: "▦" },
  { key: "inventory-service", name: "Inventory Service", port: 8082, description: "Stock tracking and reservation", icon: "▤" },
  { key: "purchase-service", name: "Purchase Service", port: 8083, description: "Purchase processing and events", icon: "⇩" },
  { key: "sale-service", name: "Sale Service", port: 8084, description: "Sales and order processing", icon: "⇧" },
  { key: "notification-service", name: "Notification Service", port: 8085, description: "Notification delivery and alerts", icon: "♧" },
];

const QUEUE_NAMES = [
  "purchase-events",
  "stock-reservation-requests",
  "stock-reserved",
  "stock-insufficient",
  "low-stock-alerts",
  "sale-failed",
  "sale-completed",
];

const TECH_STACK = [
  { name: "Java 17", category: "Language", icon: "☕" },
  { name: "Spring Boot", category: "Backend", icon: "🍃" },
  { name: "Spring Cloud Gateway", category: "API Gateway", icon: "⇄" },
  { name: "React + Vite", category: "Frontend", icon: "⚛" },
  { name: "PostgreSQL", category: "Database", icon: "◉" },
  { name: "AWS SQS / LocalStack", category: "Messaging", icon: "↗" },
  { name: "Docker Compose", category: "Containers", icon: "▣" },
  { name: "Prometheus + Grafana", category: "Monitoring", icon: "◷" },
  { name: "Jaeger + Loki", category: "Observability", icon: "⌁" },
];

function StatusBadge({ status }) {
  const normalized = (status || "UNKNOWN").toUpperCase();
  return (
    <span className={`status-badge status-${normalized.toLowerCase()}`}>
      <span className="status-dot" />
      {normalized}
    </span>
  );
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}

function sortLatest(records, dateKey) {
  return [...(Array.isArray(records) ? records : [])]
    .sort((a, b) => new Date(b[dateKey] || 0).getTime() - new Date(a[dateKey] || 0).getTime())
    .slice(0, 10);
}

function SectionHeader({ title, subtitle, trailing }) {
  return (
    <div className="section-heading">
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      {trailing}
    </div>
  );
}

export default function ArchitectureDashboard() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastChecked, setLastChecked] = useState(null);

  const [queueStats, setQueueStats] = useState(null);
  const [queueError, setQueueError] = useState("");
  const [purchases, setPurchases] = useState([]);
  const [sales, setSales] = useState([]);
  const [activityError, setActivityError] = useState("");

  const fetchHealth = useCallback(async (initial = false) => {
    if (initial) setLoading(true);
    try {
      const response = await apiClient.get("/gateway/health", { timeout: 120000 });
      setHealth(response.data);
      setError("");
      setLastChecked(new Date());
    } catch (err) {
      setError(
        err.response
          ? `Health endpoint returned HTTP ${err.response.status}`
          : err.code === "ECONNABORTED"
            ? "Health check timed out. Please retry."
            : "Unable to reach the API Gateway health endpoint."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDashboardData = useCallback(async () => {
    const results = await Promise.allSettled([
      apiClient.get("/api/admin/queue-stats", { timeout: 15000 }),
      apiClient.get("/api/purchases", { timeout: 15000 }),
      apiClient.get("/api/sales", { timeout: 15000 }),
    ]);

    if (results[0].status === "fulfilled") {
      setQueueStats(results[0].value.data);
      setQueueError("");
    } else {
      setQueueError("Queue stats unavailable. Check the gateway and LocalStack connection.");
    }

    const purchaseResult = results[1];
    const saleResult = results[2];

    if (purchaseResult.status === "fulfilled" && saleResult.status === "fulfilled") {
      setPurchases(sortLatest(purchaseResult.value.data, "purchaseDate"));
      setSales(sortLatest(saleResult.value.data, "saleDate"));
      setActivityError("");
    } else {
      setActivityError("Could not load one or more activity lists. Use Refresh to retry.");
      if (purchaseResult.status === "fulfilled") {
        setPurchases(sortLatest(purchaseResult.value.data, "purchaseDate"));
      }
      if (saleResult.status === "fulfilled") {
        setSales(sortLatest(saleResult.value.data, "saleDate"));
      }
    }
  }, []);

  const refreshAll = useCallback(async (initial = false) => {
    await Promise.all([fetchHealth(initial), fetchDashboardData()]);
  }, [fetchHealth, fetchDashboardData]);

  useEffect(() => {
    refreshAll(true);
    const intervalId = setInterval(() => refreshAll(false), 30000);
    return () => clearInterval(intervalId);
  }, [refreshAll]);

  const services = SERVICES.map((service) => ({
    ...service,
    status: health?.services?.[service.key]?.status || "UNKNOWN",
  }));

  const healthyCount = services.filter(
    (service) => service.status.toUpperCase() === "UP"
  ).length;
  const overallStatus = error
    ? "UNREACHABLE"
    : health?.status || (loading ? "CHECKING" : "UNKNOWN");

  const queues = QUEUE_NAMES.map((name) => {
    const item = queueStats?.[name] || {};
    return {
      name,
      messages: Number(item.messages ?? 0),
      inFlight: Number(item.inFlight ?? 0),
      delayed: Number(item.delayed ?? 0),
    };
  });

  const queueCount = Number(queueStats?.queueCount ?? queues.length);
  const totalMessages = queues.reduce((sum, queue) => sum + queue.messages, 0);
  const totalInFlight = queues.reduce((sum, queue) => sum + queue.inFlight, 0);
  const totalDelayed = queues.reduce((sum, queue) => sum + queue.delayed, 0);

  return (
    <main className="architecture-page">
      <section className="architecture-hero">
        <div>
          <p className="architecture-eyebrow">SYSTEM OVERVIEW</p>
          <h1>Microservices Architecture</h1>
          <p className="architecture-subtitle">
            Monitor service health, asynchronous messaging and recent business activity.
          </p>
        </div>
        <button
          className="health-refresh-button"
          onClick={() => refreshAll(false)}
          disabled={loading}
        >
          {loading ? "Checking..." : "↻ Refresh"}
        </button>
      </section>

      {error && (
        <div className="architecture-error" role="alert">
          <strong>Health check issue:</strong> {error}
          <p>Previously received service data is retained when a refresh fails.</p>
        </div>
      )}

      <section className="architecture-summary">
        <article className="summary-card">
          <span className="summary-label">Overall Status</span>
          <StatusBadge status={overallStatus} />
          <p>API Gateway health</p>
        </article>
        <article className="summary-card">
          <span className="summary-label">Healthy Services</span>
          <strong className="summary-number">
            {loading && !health ? "—" : `${healthyCount} / ${SERVICES.length}`}
          </strong>
          <p>Microservices reporting UP</p>
        </article>
        <article className="summary-card">
          <span className="summary-label">SQS Queues</span>
          <strong className="summary-number">{queueStats ? queueCount : "—"}</strong>
          <p>{totalMessages} visible messages across monitored queues</p>
        </article>
      </section>

      <section className="service-section">
        <SectionHeader
          title="Service Health"
          subtitle="Current status reported by the API Gateway"
          trailing={lastChecked && (
            <span className="last-checked">Last checked: {lastChecked.toLocaleTimeString()}</span>
          )}
        />
        <div className="service-grid">
          {services.map((service) => (
            <article
              className={`service-card service-card-${service.status.toLowerCase()}`}
              key={service.key}
            >
              <div className="service-card-top">
                <div className="service-icon" aria-hidden="true">{service.icon}</div>
                <StatusBadge status={service.status} />
              </div>
              <h3>{service.name}</h3>
              <p className="service-description">{service.description}</p>
              <div className="service-card-footer">
                <span>Service port</span>
                <code>{service.port}</code>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="dashboard-panel queue-panel">
        <SectionHeader
          title="SQS Queue Monitoring"
          subtitle="Live message counts from LocalStack queues"
          trailing={<span className="live-indicator"><span /> Auto-refresh · 30 sec</span>}
        />

        {queueError && (
          <div className="architecture-error" role="alert">{queueError}</div>
        )}

        <div className="queue-summary-grid">
          <article className="queue-metric">
            <span>Visible messages</span>
            <strong>{queueStats ? totalMessages : "—"}</strong>
          </article>
          <article className="queue-metric">
            <span>In flight</span>
            <strong>{queueStats ? totalInFlight : "—"}</strong>
          </article>
          <article className="queue-metric">
            <span>Delayed</span>
            <strong>{queueStats ? totalDelayed : "—"}</strong>
          </article>
        </div>

        <div className="queue-grid">
          {queues.map((queue) => (
            <article className="queue-card" key={queue.name}>
              <div className="queue-card-heading">
                <span className="queue-symbol">↗</span>
                <span className="queue-message-count">{queueStats ? queue.messages : "—"}</span>
              </div>
              <h3>{queue.name}</h3>
              <div className="queue-card-footer">
                <span>In flight: {queueStats ? queue.inFlight : "—"}</span>
                <span>Delayed: {queueStats ? queue.delayed : "—"}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="dashboard-panel">
        <SectionHeader
          title="Event Flow"
          subtitle="Illustrated path for purchase and sale processing"
        />
        <div className="event-flow">
          <div className="flow-node">
            <span className="flow-node-icon">🖥</span>
            <strong>API Gateway</strong>
            <small>HTTP requests</small>
          </div>
          <div className="flow-connector"><span>➜</span><small>Route</small></div>
          <div className="flow-node">
            <span className="flow-node-icon">📦</span>
            <strong>Business Service</strong>
            <small>Purchase / Sale</small>
          </div>
          <div className="flow-connector"><span>➜</span><small>Publish</small></div>
          <div className="flow-node flow-node-queue">
            <span className="flow-node-icon">☁</span>
            <strong>AWS SQS</strong>
            <small>Async events</small>
          </div>
          <div className="flow-connector"><span>➜</span><small>Consume</small></div>
          <div className="flow-node">
            <span className="flow-node-icon">🔔</span>
            <strong>Notifications</strong>
            <small>Alerts</small>
          </div>
        </div>
        <p className="flow-disclaimer">
          Diagram shows the intended event-driven flow; arrows are illustrative, not a live trace.
        </p>
      </section>

      <section className="dashboard-panel">
        <SectionHeader
          title="Recent Purchases & Sales"
          subtitle="Latest 10 records per activity, sorted by event date"
        />
        {activityError && (
          <div className="architecture-error" role="alert">{activityError}</div>
        )}
        <div className="activity-grid">
          <article className="activity-panel">
            <div className="activity-title">
              <h3>Recent Purchases</h3>
              <span>{purchases.length} records</span>
            </div>
            {purchases.length === 0 ? (
              <p className="empty-activity">No purchase records available.</p>
            ) : (
              <div className="activity-table-wrap">
                <table className="activity-table">
                  <thead><tr><th>ID</th><th>Product</th><th>Qty</th><th>Date</th></tr></thead>
                  <tbody>
                    {purchases.map((item) => (
                      <tr key={item.purchaseId}>
                        <td>#{item.purchaseId}</td>
                        <td>{item.productId}</td>
                        <td>{item.quantity}</td>
                        <td>{formatDate(item.purchaseDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>

          <article className="activity-panel">
            <div className="activity-title">
              <h3>Recent Sales</h3>
              <span>{sales.length} records</span>
            </div>
            {sales.length === 0 ? (
              <p className="empty-activity">No sale records available.</p>
            ) : (
              <div className="activity-table-wrap">
                <table className="activity-table">
                  <thead><tr><th>ID</th><th>Product</th><th>Qty</th><th>Date</th></tr></thead>
                  <tbody>
                    {sales.map((item) => (
                      <tr key={item.saleId}>
                        <td>#{item.saleId}</td>
                        <td>{item.productId}</td>
                        <td>{item.quantity}</td>
                        <td>{formatDate(item.saleDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>
        </div>
      </section>

      <section className="dashboard-panel">
        <SectionHeader
          title="Technology Stack"
          subtitle="Core components powering the Inventory Management platform"
        />
        <div className="tech-grid">
          {TECH_STACK.map((tech) => (
            <article className="tech-card" key={tech.name}>
              <span className="tech-icon" aria-hidden="true">{tech.icon}</span>
              <div>
                <h3>{tech.name}</h3>
                <p>{tech.category}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="architecture-note">
        <div className="architecture-note-icon" aria-hidden="true">i</div>
        <div>
          <h3>Health and data monitoring</h3>
          <p>
            Service status comes from <code>/gateway/health</code>, queue counts from
            <code> /api/admin/queue-stats</code>, and activity from <code>/api/purchases</code>
            and <code>/api/sales</code>. Dashboard data refreshes every 30 seconds.
          </p>
        </div>
      </section>
    </main>
  );
}