import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import apiClient from "../api/apiClient";

const links = [
  { to: "/", label: "Dashboard", icon: "▦", end: true },
  { to: "/products", label: "Products", icon: "▤" },
  { to: "/inventory", label: "Inventory", icon: "▥" },
  { to: "/purchases", label: "Purchases", icon: "↓" },
  { to: "/sales", label: "Sales", icon: "↗" },
];

export default function Navbar() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let active = true;
    let timer;
    const poll = async () => {
      try {
        const response = await apiClient.get("/api/notifications", { timeout: 5000 });
        if (active) {
          const items = Array.isArray(response.data) ? response.data : [];
          setUnreadCount(items.filter((item) => !item.isRead).length);
        }
      } catch (error) {
        if (active) console.warn("Notification count unavailable:", error.response?.status ?? error.code);
      } finally {
        if (active) timer = setTimeout(poll, 10000);
      }
    };
    poll();
    return () => { active = false; clearTimeout(timer); };
  }, []);

  return <aside className="app-sidebar">
    <NavLink to="/" className="sidebar-brand">
      <span className="brand-mark">I</span>
      <span><strong>INVENTORY</strong><small>MANAGEMENT SUITE</small></span>
    </NavLink>
    <div className="sidebar-section-label">WORKSPACE</div>
    <nav className="sidebar-nav" aria-label="Main navigation">
      {links.map((item) => <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
        <span className="sidebar-icon">{item.icon}</span><span>{item.label}</span>
      </NavLink>)}
    </nav>
    <div className="sidebar-section-label sidebar-tools-label">SYSTEM</div>
    <nav className="sidebar-nav">
      <NavLink to="/architecture" className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}><span className="sidebar-icon">⌘</span><span>Architecture</span></NavLink>
      <NavLink to="/notifications" className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}><span className="sidebar-icon">♧</span><span>Notifications</span>{unreadCount > 0 && <span className="sidebar-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>}</NavLink>
    </nav>
    <div className="sidebar-footer"><span className="sidebar-status-dot" /> API workspace <small>Gateway connected by proxy</small></div>
  </aside>;
}
