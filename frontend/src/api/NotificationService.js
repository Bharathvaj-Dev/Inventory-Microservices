import { useCallback, useEffect, useState } from "react";
import apiClient from "../api/apiClient";

export default function Notifications() {
const [notifications, setNotifications] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");

const fetchNotifications = useCallback(async () => {
try {
const response = await apiClient.get("/api/notifications");
setNotifications(Array.isArray(response.data) ? response.data : []);
setError("");
} catch (err) {
setError("Failed to load notifications.");
console.error(err);
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
setError("Unable to mark notification as read.");
console.error(err);
}
}

return ( <main className="notifications-page"> <div className="notifications-header"> <div> <h1>Notifications</h1> <p>Unread alerts: {unreadCount}</p> </div>
    <button
      disabled={unreadCount === 0}
      onClick={async () => {
        try {
          await apiClient.patch("/api/notifications/read-all");
          await fetchNotifications();
        } catch (err) {
          setError("Mark all as read failed. Check the backend endpoint.");
          console.error(err);
        }
      }}
    >
      Mark all as read
    </button>
  </div>

  {error && <p role="alert">{error}</p>}

  {loading ? (
    <p>Loading notifications...</p>
  ) : notifications.length === 0 ? (
    <p>No notifications found.</p>
  ) : (
    notifications.map((item) => {
      const stockMatch = item.message?.match(/stock:\s*(\d+)/i);
      const stock = stockMatch ? Number(stockMatch[1]) : null;
      const severity =
        stock === 0 ? "CRITICAL" : stock !== null && stock < 10
          ? "WARNING"
          : "INFO";

      return (
        <article
          key={item.id}
          className={`notification-card ${item.isRead ? "read" : "unread"}`}
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
    })
  )}
</main>

);
}
