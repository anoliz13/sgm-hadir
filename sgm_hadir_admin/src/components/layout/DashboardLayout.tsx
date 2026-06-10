/**
 * Dashboard Layout - Wraps all authenticated pages with sidebar
 */

import React, { useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import Sidebar from "./Sidebar";
import { Loader2 } from "lucide-react";

export default function DashboardLayout() {
  const { userData, loading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--color-bg)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <Loader2
            size={40}
            className="animate-spin"
            style={{ color: "var(--color-primary)", marginBottom: "12px" }}
          />
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem" }}>
            Memuat...
          </p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-layout">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <main className={`main-content ${sidebarCollapsed ? "collapsed" : ""}`}>
        <Outlet />
      </main>
    </div>
  );
}
