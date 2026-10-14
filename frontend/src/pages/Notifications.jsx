import { useCallback, useEffect, useState } from "react";
import apiClient from "../api/apiClient";

export default function Notifications() {
const [notifications, setNotifications] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");

const fetchNotifications = useCallback(async () => {
try {
const response = await apiClient.get("/api/notifications");
setNotifications(
Array.isArray(response.data) ? response.data : []
);
setError("");
} catch (err) {
console.error(err);
setError("Failed to load notifications.");
} finally {
setLoading(false);
}
}, []);

useEffect(() => {
fetchNotifications();
const intervalId = setInterval(fetchNotifications, 10000);
return () => clearInterval(intervalId);
}, [fetchNotifications]);

const unreadCount = notifications.filter(
(item) => !item.isRead
).length;

async function markAsRead(id) {
try {
await apiClient.patch(`/api/notifications/${id}/read`);
await fetchNotifications();
} catch (err) {
console.error(err);
setError("Failed to mark notification as read.");
}
}

async function markAllAsRead() {
try {
await apiClient.patch("/api/notifications/read-all");
await fetchNotifications();
} catch (err) {
console.error(err);
setError("Bulk read failed. Check whether the backend endpoint exists.");
}
}

return ( <main className="container notifications-page"> <div className="notifications-header"> <div> <h2>Notifications</h2> <p>Unread alerts: {unreadCount}</p> </div>

    <button
      onClick={markAllAsRead}
      disabled={unreadCount === 0}
    >
      Mark all as read
    </button>
  </div>

  {error && <p className="error">{error}</p>}
  {loading && <p>Loading notifications...</p>}

  {!loading && notifications.length === 0 && !error && (
    <p>No notifications found.</p>
  )}

  <div className="notification-list">
    {notifications.map((item) => {
      const match = item.message?.match(/stock:\s*(\d+)/i);
      const stock = match ? Number(match[1]) : null;
      const severity =
        stock === 0
          ? "CRITICAL"
          : stock !== null && stock < 10
            ? "WARNING"
            : "INFO";

      return (
        <article
          key={item.id}
          className={`notification-card ${
            item.isRead ? "read" : "unread"
          }`}
        >
          <div>
            <strong>{severity}</strong>
            <p>{item.message}</p>
            <small>Product ID: {item.productId}</small>
            <p>
              {item.createdAt
                ? new Date(item.createdAt).toLocaleString()
                : ""}
            </p>
            <small>{item.isRead ? "Read" : "Unread"}</small>
          </div>

          {!item.isRead && (
            <button onClick={() => markAsRead(item.id)}>
              Mark as read
            </button>
          )}
        </article>
      );
    })}
  </div>
</main>

);
}
