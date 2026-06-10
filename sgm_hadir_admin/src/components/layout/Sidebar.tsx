/**
 * Sidebar Navigation Component
 */

import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useRoleAccess } from "../../hooks/useRoleAccess";
import { ROLE_LABELS } from "../../lib/types";
import {
  LayoutDashboard,
  Users,
  Building2,
  ClipboardCheck,
  CalendarClock,
  Calendar,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckSquare,
  MapPin,
  AlarmClock,
  Shield,
} from "lucide-react";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: number;
  roles?: string[]; // if undefined, visible to all
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { userData, logout } = useAuth();
  const { role, canApprove, canManageEmployees, canManageBranches } = useRoleAccess();

  const navSections: { title: string; items: NavItem[] }[] = [
    {
      title: "UTAMA",
      items: [
        { label: "Dashboard", icon: <LayoutDashboard size={20} />, path: "/" },
      ],
    },
    {
      title: "ABSENSI",
      items: [
        { label: "Rekap Kehadiran", icon: <ClipboardCheck size={20} />, path: "/recap" },
        { label: "Detail Absensi", icon: <Clock size={20} />, path: "/attendance" },
        { label: "Kunjungan Marketing", icon: <MapPin size={20} />, path: "/visits" },
      ],
    },
    ...(canApprove ? [{
      title: "APPROVAL",
      items: [
        { label: "Pengajuan Izin", icon: <CalendarClock size={20} />, path: "/leave-approval" },
        { label: "Pengajuan Lembur", icon: <CheckSquare size={20} />, path: "/overtime-approval" },
      ],
    }] : []),
    ...(canManageEmployees ? [{
      title: "KELOLA",
      items: [
        { label: "Karyawan", icon: <Users size={20} />, path: "/employees" },
        ...(canManageBranches ? [{ label: "Cabang", icon: <Building2 size={20} />, path: "/branches" }] : []),
        { label: "Manajemen Shift", icon: <AlarmClock size={20} />, path: "/shifts" },
        { label: "Hari Libur", icon: <Calendar size={20} />, path: "/holidays" },
      ],
    }] : []),
    {
      title: "LAINNYA",
      items: [
        { label: "Laporan", icon: <BarChart3 size={20} />, path: "/reports" },
        ...(role === "super_admin" || role === "supervisor" ? [
          { label: "Pengaturan", icon: <Settings size={20} />, path: "/settings" },
          { label: "Role & Permission", icon: <Shield size={20} />, path: "/roles" },
        ] : []),
      ],
    },
  ];



  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-circle">SGM</div>
        {!collapsed && (
          <div className="logo-text">
            <h1>SGM Hadir</h1>
            <p>Admin Dashboard</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navSections.map((section) => (
          <div key={section.title} className="nav-section">
            {!collapsed && (
              <div className="nav-section-title">{section.title}</div>
            )}
            {section.items
              .map((item) => {
                const isActive =
                  item.path === "/"
                    ? location.pathname === "/"
                    : location.pathname.startsWith(item.path);

                return (
                  <div
                    key={item.path}
                    className={`nav-item ${isActive ? "active" : ""}`}
                    onClick={() => navigate(item.path)}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className="nav-item-icon">{item.icon}</span>
                    {!collapsed && <span>{item.label}</span>}
                    {!collapsed && item.badge && item.badge > 0 && (
                      <span className="nav-badge">{item.badge}</span>
                    )}
                  </div>
                );
              })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        {/* User info */}
        {!collapsed && userData && (
          <div
            style={{
              padding: "8px 12px",
              marginBottom: "8px",
              borderRadius: "8px",
              background: "rgba(255,255,255,0.05)",
            }}
          >
            <div
              style={{
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: "white",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {userData.name}
            </div>
            <div
              style={{
                fontSize: "0.6875rem",
                opacity: 0.6,
              }}
            >
              {userData.role ? ROLE_LABELS[userData.role] ?? userData.role : "—"}
            </div>
          </div>
        )}

        {/* Collapse toggle */}
        <div
          className="nav-item"
          onClick={onToggle}
          title={collapsed ? "Perluas" : "Perkecil"}
        >
          <span className="nav-item-icon">
            {collapsed ? (
              <ChevronRight size={20} />
            ) : (
              <ChevronLeft size={20} />
            )}
          </span>
          {!collapsed && <span>Perkecil Menu</span>}
        </div>

        <button
          onClick={() => logout()}
          className="sidebar-logout"
        >
          <LogOut size={20} />
          {!collapsed && <span>Keluar</span>}
        </button>
      </div>
    </aside>
  );
}
