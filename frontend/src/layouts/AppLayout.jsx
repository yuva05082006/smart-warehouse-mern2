import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";
import Topbar from "../components/Topbar.jsx";

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <Sidebar open={sidebarOpen} />
      <Topbar onToggleSidebar={() => setSidebarOpen((s) => !s)} />
      <div className="app-content">
        <Outlet />
      </div>
    </>
  );
}
