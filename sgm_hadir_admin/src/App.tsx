/**
 * SGM Hadir Admin Dashboard - Main Application
 */

import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./contexts/AuthContext";
import { useFcmToken } from "./hooks/useFcmToken";
import DashboardLayout from "./components/layout/DashboardLayout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import AttendanceRecapPage from "./pages/AttendanceRecapPage";
import AttendanceLogPage from "./pages/AttendanceLogPage";
import EmployeeManagementPage from "./pages/EmployeeManagementPage";
import BranchManagementPage from "./pages/BranchManagementPage";
import MarketingVisitPage from "./pages/MarketingVisitPage";
import LeaveApprovalPage from "./pages/LeaveApprovalPage";
import OvertimeApprovalPage from "./pages/OvertimeApprovalPage";
import ShiftManagementPage from "./pages/ShiftManagementPage";
import LaporanPage from "./pages/LaporanPage";
import PengaturanPage from "./pages/PengaturanPage";
import RoleManagementPage from "./pages/RoleManagementPage";

// Placeholder pages for routes that will be built in later phases
function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">{title}</h1>
        <p className="page-subtitle">{description}</p>
      </div>
      <div className="card">
        <div className="empty-state" style={{ padding: "80px 24px" }}>
          <div
            style={{
              width: "80px",
              height: "80px",
              margin: "0 auto 20px",
              background: "var(--color-primary-50)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2rem",
            }}
          >
            🚧
          </div>
          <p className="empty-state-title">Segera Hadir</p>
          <p className="empty-state-desc">
            Fitur ini sedang dalam pengembangan dan akan tersedia di fase berikutnya.
          </p>
        </div>
      </div>
    </div>
  );
}

function FcmInitializer() {
  useFcmToken();
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <FcmInitializer />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: "8px",
              fontSize: "0.875rem",
              fontWeight: 500,
              boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
            },
            success: {
              iconTheme: { primary: "#10B981", secondary: "white" },
            },
            error: {
              iconTheme: { primary: "#EF4444", secondary: "white" },
            },
          }}
        />

        <Routes>
          {/* Public route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected routes */}
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/recap" element={<AttendanceRecapPage />} />
            <Route path="/attendance" element={<AttendanceLogPage />} />
            <Route path="/visits" element={<MarketingVisitPage />} />
            <Route
              path="/leave-approval"
              element={<LeaveApprovalPage />}
            />
            <Route
              path="/overtime-approval"
              element={<OvertimeApprovalPage />}
            />
            <Route path="/employees" element={<EmployeeManagementPage />} />
            <Route path="/branches" element={<BranchManagementPage />} />
            <Route path="/shifts" element={<ShiftManagementPage />} />
            <Route path="/holidays" element={<ShiftManagementPage />} />
            <Route path="/reports" element={<LaporanPage />} />
            <Route path="/settings" element={<PengaturanPage />} />
            <Route path="/roles" element={<RoleManagementPage />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
