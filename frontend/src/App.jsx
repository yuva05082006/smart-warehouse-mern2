import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AppLayout from "./layouts/AppLayout.jsx";

import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Products from "./pages/Products.jsx";
import Inventory from "./pages/Inventory.jsx";
import Receiving from "./pages/Receiving.jsx";
import Warehouses from "./pages/Warehouses.jsx";
import BinRecommendation from "./pages/BinRecommendation.jsx";
import Orders from "./pages/Orders.jsx";
import Picking from "./pages/Picking.jsx";
import Dispatch from "./pages/Dispatch.jsx";
import Tracking from "./pages/Tracking.jsx";
import Alerts from "./pages/Alerts.jsx";
import ActivityLog from "./pages/ActivityLog.jsx";

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/receiving" element={<Receiving />} />
            <Route path="/warehouses" element={<Warehouses />} />
            <Route path="/bin-recommendation" element={<BinRecommendation />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/picking" element={<Picking />} />
            <Route path="/dispatch" element={<Dispatch />} />
            <Route path="/tracking" element={<Tracking />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/activity-log" element={<ActivityLog />} />
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}
