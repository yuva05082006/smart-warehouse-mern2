import React from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { NAV_ITEMS } from "./Sidebar.jsx";

export default function Topbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const active = NAV_ITEMS.find((i) => i.to === location.pathname);

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  return (
    <header className="topbar">
      <button className="hamburger" aria-label="Toggle menu" onClick={onToggleSidebar}>☰</button>
      <div className="topbar-title">{active ? active.label : ""}</div>
      <div className="topbar-user">
        <span className="badge badge-role">{user?.role}</span>
        <span className="user-name">{user?.fullName}</span>
        <button className="btn btn-outline btn-small" onClick={handleLogout}>Logout</button>
      </div>
    </header>
  );
}
