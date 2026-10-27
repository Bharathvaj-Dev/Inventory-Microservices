import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../api/apiClient";

export default function Navbar() {
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshCount = useCallback(async () => {
    try {
      const response = await apiClient.get("/api/notifications");
      const items = Array.isArray(response.data) ? response.data : [];
      setUnreadCount(items.filter((item) => !item.isRead).length);
    } catch (err) {
      console.error("Failed to refresh notification badge", err);
    }
  }, []);

  useEffect(() => {
    refreshCount();
    const intervalId = setInterval(refreshCount, 10000);
    return () => clearInterval(intervalId);
  }, [refreshCount]);

  return (<nav className="navbar"> <Link to="/">Inventory Dashboard</Link>
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
