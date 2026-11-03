import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../api/apiClient";

export default function Navbar() {
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshCount = useCallback(async () => {
    try {
      const response = await apiClient.get("/api/notifications", {
        timeout: 5000,
      });

      const items = Array.isArray(response.data) ? response.data : [];
      setUnreadCount(items.filter((item) => !item.isRead).length);
    } catch (err) {
      console.error(
        "Notification badge refresh failed:",
        err.response?.status ?? err.code ?? err.message
      );
    }
  }, []);

  useEffect(() => {
    let active = true;
    let timerId;

    const poll = async () => {
      try {
        const response = await apiClient.get("/api/notifications", {
          timeout: 5000,
        });

        if (active) {
          const items = Array.isArray(response.data) ? response.data : [];
          setUnreadCount(items.filter((item) => !item.isRead).length);
        }
      } catch (err) {
        if (active) {
          console.error(
            "Notification badge refresh failed:",
            err.response?.status ?? err.code ?? err.message
          );
        }
      } finally {
        if (active) {
          timerId = setTimeout(poll, 10000);
        }
      }
    };

    poll();

    return () => {
      active = false;
      clearTimeout(timerId);
    };
  }, []);

  return (
    <nav className="navbar">
      <Link to="/">Inventory Dashboard</Link>
      <Link to="/architecture">Architecture</Link>

      <Link to="/notifications" className="bell-link">
        <span aria-hidden="true">🔔</span>
        Notifications
        {unreadCount > 0 && (
          <span className="unread-badge">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Link>
    </nav>
  );
}
