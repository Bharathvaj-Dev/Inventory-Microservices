import { useCallback, useEffect, useMemo, useState } from "react";
import apiClient from "../api/apiClient";
import "./Notifications.css";

function getSeverity(message = "") {
  const match = message.match(/stock:\s*(\d+)/i);
  if (!match) return "INFO";
  const stock = Number(match[1]);
  return stock === 0 ? "CRITICAL" : stock < 10 ? "WARNING" : "INFO";
}

function formatDate(value) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [actionId, setActionId] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const response = await apiClient.get("/api/notifications");
      setNotifications(Array.isArray(response.data) ? response.data : []);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Unable to load notifications. Please check the API Gateway and try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => { void fetchNotifications(); }, 0);
    const intervalId = window.setInterval(() => { void fetchNotifications(); }, 10000);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(intervalId);
    };
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((item) => !item.isRead).length;
  const readCount = notifications.length - unreadCount;
  const visibleNotifications = useMemo(() => notifications.filter((item) => {
    if (filter === "UNREAD") return !item.isRead;
    if (filter === "READ") return item.isRead;
    return true;
  }), [notifications, filter]);

  async function markAsRead(id) {
    setActionId(id);
    setError("");
    try {
      await apiClient.patch(`/api/notifications/${id}/read`);
      await fetchNotifications();
    } catch (err) {
      console.error(err);
      setError("Failed to mark this notification as read.");
    } finally {
      setActionId(null);
    }
  }

  async function markAllAsRead() {
    setMarkingAll(true);
    setError("");
    try {
      await apiClient.patch("/api/notifications/read-all");
      await fetchNotifications();
    } catch (err) {
      console.error(err);
      setError("Unable to mark all notifications as read.");
    } finally {
      setMarkingAll(false);
    }
  }

  return (
    <main className="notifications-page">
      <header className="notifications-heading">
        <div>
          <span className="notifications-eyebrow">SYSTEM ACTIVITY</span>
          <h1>Notifications</h1>
          <p>Stay updated with stock alerts and inventory events.</p>
        </div>
        <div className="notifications-heading-actions">
          <button className="notification-button notification-button-secondary" onClick={() => fetchNotifications(true)} disabled={refreshing}>
            <span aria-hidden="true">↻</span> {refreshing ? "Refreshing..." : "Refresh"}
          </button>
          <button className="notification-button notification-button-primary" onClick={markAllAsRead} disabled={unreadCount === 0 || markingAll}>
            {markingAll ? "Updating..." : "Mark all as read"}
          </button>
        </div>
      </header>

      {error && <p className="notifications-error" role="alert">{error}</p>}

      <section className="notifications-summary" aria-label="Notification summary">
        <article className="notification-summary-card">
          <span className="notification-summary-icon notification-icon-total">▤</span>
          <div><span>Total notifications</span><strong>{loading ? "—" : notifications.length}</strong></div>
        </article>
        <article className="notification-summary-card">
          <span className="notification-summary-icon notification-icon-unread">●</span>
          <div><span>Unread alerts</span><strong>{loading ? "—" : unreadCount}</strong></div>
        </article>
        <article className="notification-summary-card">
          <span className="notification-summary-icon notification-icon-read">✓</span>
          <div><span>Read notifications</span><strong>{loading ? "—" : readCount}</strong></div>
        </article>
      </section>

      <section className="notifications-panel">
        <div className="notifications-panel-heading">
          <div>
            <h2>Recent activity</h2>
            <p>Notifications refresh automatically every 10 seconds.</p>
          </div>
          <div className="notification-filters" role="group" aria-label="Filter notifications">
            {[
              { value: "ALL", label: "All", count: notifications.length },
              { value: "UNREAD", label: "Unread", count: unreadCount },
              { value: "READ", label: "Read", count: readCount },
            ].map((item) => (
              <button key={item.value} className={filter === item.value ? "active" : ""} onClick={() => setFilter(item.value)}>
                {item.label}<span>{item.count}</span>
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="notifications-empty"><span className="notification-empty-icon">◷</span><strong>Loading notifications</strong><p>Please wait while we fetch the latest activity.</p></div>
        ) : visibleNotifications.length === 0 ? (
          <div className="notifications-empty">
            <span className="notification-empty-icon">{filter === "UNREAD" ? "✓" : "♧"}</span>
            <strong>{filter === "UNREAD" ? "You're all caught up" : filter === "READ" ? "No read notifications" : "No notifications yet"}</strong>
            <p>{filter === "UNREAD" ? "There are no unread alerts right now." : "New inventory alerts and events will appear here."}</p>
          </div>
        ) : (
          <div className="notification-items">
            {visibleNotifications.map((item) => {
              const severity = getSeverity(item.message);
              return (
                <article key={item.id} className={`notification-item ${item.isRead ? "is-read" : "is-unread"}`}>
                  <span className={`notification-severity-icon severity-icon-${severity.toLowerCase()}`} aria-hidden="true">
                    {severity === "CRITICAL" ? "!" : severity === "WARNING" ? "▲" : "i"}
                  </span>
                  <div className="notification-item-content">
                    <div className="notification-item-topline">
                      <span className={`notification-severity severity-${severity.toLowerCase()}`}>{severity}</span>
                      <span className={`notification-read-state ${item.isRead ? "state-read" : "state-unread"}`}>{item.isRead ? "Read" : "Unread"}</span>
                    </div>
                    <p className="notification-message">{item.message || "Inventory event received."}</p>
                    <div className="notification-meta">
                      <span>Product ID: <strong>{item.productId ?? "—"}</strong></span>
                      <span>{formatDate(item.createdAt)}</span>
                    </div>
                  </div>
                  {!item.isRead && (
                    <button className="notification-mark-button" onClick={() => markAsRead(item.id)} disabled={actionId === item.id}>
                      {actionId === item.id ? "Saving..." : "Mark as read"}
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
      <p className="notifications-footnote">Stock alert severity is identified from the available stock value in each notification message.</p>
    </main>
  );
}
