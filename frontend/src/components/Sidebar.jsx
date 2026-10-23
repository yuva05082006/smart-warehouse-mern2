import React from "react";
import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: "📊" },
  { to: "/products", label: "Products", icon: "📦" },
  { to: "/inventory", label: "Inventory", icon: "🗃️" },
  { to: "/receiving", label: "Stock Receiving", icon: "📥" },
  { to: "/warehouses", label: "Warehouses / Racks / Bins", icon: "🏭" },
  { to: "/bin-recommendation", label: "Smart Bin Recommendation", icon: "🧠" },
  { to: "/orders", label: "Orders", icon: "🧾" },
  { to: "/picking", label: "Picking", icon: "🧺" },
  { to: "/dispatch", label: "Dispatch", icon: "🚚" },
  { to: "/tracking", label: "Product Tracking / QR", icon: "🔍" },
  { to: "/alerts", label: "Stock Alerts", icon: "⚠️" },
  { to: "/activity-log", label: "Activity Log", icon: "🕒" },
];

export default function Sidebar({ open }) {
  return (
    <aside className={"sidebar" + (open ? " open" : "")}>
      <div className="sidebar-brand">🏬 Smart Warehouse</div>
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export { NAV_ITEMS };
