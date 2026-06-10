/**
 * Dashboard Page - Real-time attendance overview
 */

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useRoleAccess } from "../hooks/useRoleAccess";
import { api } from "../lib/api";
import { useWebSocket } from "../hooks/useWebSocket";
import StatCard from "../components/ui/StatCard";
import StatusBadge from "../components/ui/StatusBadge";
import type { Branch } from "../lib/types";
import {
  Users,
  UserCheck,
  Clock,
  AlertTriangle,
  CalendarOff,
  Loader2,
  TrendingUp,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const PIE_COLORS = ["#10B981", "#F59E0B", "#EF4444", "#6366F1", "#8B5CF6"];

export default function DashboardPage() {
  const { userData } = useAuth();
  const { isSuperAdmin, isSupervisor } = useRoleAccess();
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>("all");

  const [summary, setSummary] = useState({
    total_active_employees: 0,
    total_present_today: 0,
    total_not_checked_in: 0,
    total_leave_today: 0,
    total_late_today: 0,
  });

  const [recentAttendances, setRecentAttendances] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [branchComparison, setBranchComparison] = useState<any[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<any[]>([]);

  const { messages: wsMessages, isConnected } = useWebSocket('/ws/dashboard');

  useEffect(() => {
    if (wsMessages.length > 0) {
      const latestMsg = wsMessages[0];
      if (latestMsg.type === 'attendance_update') {
        setRecentAttendances(prev => [latestMsg.data, ...prev].slice(0, 20));
      }
    }
  }, [wsMessages]);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const branchParam = selectedBranch !== "all" ? `?branch_id=${selectedBranch}` : "";

      const [resBranches, resSummary, resTrend, resBranch, resLeaves, resToday] = await Promise.allSettled([
        (isSuperAdmin || isSupervisor) ? api.get('/admin/branches') : Promise.resolve({ data: { data: [] } }),
        api.get(`/admin/dashboard/summary${branchParam}`),
        api.get(`/admin/dashboard/attendance-trend?days=30${selectedBranch !== "all" ? `&branch_id=${selectedBranch}` : ""}`),
        api.get('/admin/dashboard/branch-comparison'),
        api.get('/admin/leaves?status=pending&limit=10'),
        api.get('/attendance/today'),
      ]);

      if (resBranches.status === "fulfilled") {
        setBranches(resBranches.value.data.data || []);
      }
      if (resSummary.status === "fulfilled") {
        setSummary(resSummary.value.data.data || summary);
      }
      if (resTrend.status === "fulfilled") {
        const raw = resTrend.value.data.data || [];
        setTrendData(raw.map((d: any) => ({
          ...d,
          name: new Date(d.date + "T00:00:00").toLocaleDateString("id-ID", { day: "2-digit", month: "short" }),
        })));
      }
      if (resBranch.status === "fulfilled") {
        setBranchComparison(resBranch.value.data.data || []);
      }
      if (resLeaves.status === "fulfilled") {
        setPendingLeaves(resLeaves.value.data.data || []);
      }
      if (resToday.status === "fulfilled") {
        setRecentAttendances(resToday.value.data.data || []);
      }
    } catch (error) {
      console.error("Dashboard fetch error", error);
    } finally {
      setLoading(false);
    }
  }, [selectedBranch, isSuperAdmin, isSupervisor]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchDashboard, 30_000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
    });
  };

  const getInitials = (name: string) => {
    if (!name) return '?';
    return name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();
  };

  // Pie chart data from leave distribution
  const leaveDistribution = [
    { name: "Hadir", value: summary.total_present_today },
    { name: "Belum Absen", value: summary.total_not_checked_in },
    { name: "Izin/Cuti", value: Number(summary.total_leave_today) },
    { name: "Terlambat", value: summary.total_late_today },
  ].filter(d => d.value > 0);

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Selamat datang, {userData?.name} 👋 •{" "}
            {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        {(isSuperAdmin || isSupervisor) && (
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <select
              className="form-select"
              style={{ minWidth: "180px" }}
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
            >
              <option value="all">Semua Cabang</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="stat-cards">
        <StatCard label="Karyawan Aktif" value={summary.total_active_employees} icon={<Users size={20} />} color="blue" />
        <StatCard
          label="Hadir Hari Ini"
          value={summary.total_present_today}
          icon={<UserCheck size={20} />}
          color="green"
          change={summary.total_active_employees > 0
            ? `${Math.round(summary.total_present_today / summary.total_active_employees * 100)}% dari total`
            : undefined}
          changeType="positive"
        />
        <StatCard label="Terlambat" value={summary.total_late_today} icon={<Clock size={20} />} color="yellow" />
        <StatCard label="Belum Absen" value={summary.total_not_checked_in} icon={<AlertTriangle size={20} />} color="red" />
        <StatCard label="Izin / Cuti Aktif" value={Number(summary.total_leave_today)} icon={<CalendarOff size={20} />} color="purple" />
      </div>

      {/* Charts row 1 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "20px", marginBottom: "20px" }}>
        {/* Trend 30 hari */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">📈 Tren Kehadiran 30 Hari</h3>
            <TrendingUp size={16} style={{ color: "var(--color-primary)" }} />
          </div>
          <div className="card-body" style={{ height: "280px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" fontSize={10} stroke="#94A3B8" tickLine={false} interval="preserveStartEnd" />
                <YAxis fontSize={11} stroke="#94A3B8" tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "0.8rem" }} />
                <Legend wrapperStyle={{ fontSize: "0.8rem" }} iconType="circle" />
                <Line type="monotone" dataKey="hadir" name="Hadir" stroke="#10B981" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="terlambat" name="Terlambat" stroke="#F59E0B" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="izin" name="Izin" stroke="#6366F1" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live feed */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">🔴 Absensi Live</h3>
            <span style={{ fontSize: "0.6875rem", color: isConnected ? "var(--color-success)" : "var(--color-danger)", display: "flex", alignItems: "center", gap: "4px", fontWeight: 500 }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: isConnected ? "var(--color-success)" : "var(--color-danger)" }} />
              {isConnected ? "Real-time" : "Disconnected"}
            </span>
          </div>
          <div className="card-body" style={{ maxHeight: "300px", overflowY: "auto", padding: "12px 20px" }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <Loader2 size={24} className="animate-spin" style={{ color: "var(--color-primary)" }} />
              </div>
            ) : recentAttendances.length === 0 ? (
              <div className="empty-state">
                <p className="empty-state-title">Belum ada absensi hari ini</p>
              </div>
            ) : (
              recentAttendances.slice(0, 15).map((att, idx) => (
                <div key={idx} className="feed-item animate-slide-up">
                  <div className="feed-avatar">{getInitials(att.user_name)}</div>
                  <div className="feed-info">
                    <div className="feed-name">{att.user_name}</div>
                    <div className="feed-detail">{att.type === "check_in" ? "🟢 Check-in" : "🔵 Check-out"}</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px" }}>
                    <span className="feed-time">{formatTime(att.created_at || att.timestamp)}</span>
                    <StatusBadge status={att.status} size="sm" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
        {/* Branch comparison bar chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">🏢 Perbandingan Ketepatan Waktu per Cabang</h3>
          </div>
          <div className="card-body" style={{ height: "240px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={branchComparison}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="branch_name" fontSize={10} stroke="#94A3B8" />
                <YAxis fontSize={11} stroke="#94A3B8" />
                <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "0.8rem" }} />
                <Legend wrapperStyle={{ fontSize: "0.8rem" }} />
                <Bar dataKey="total_present" name="Hadir" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="total_late" name="Terlambat" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribution pie chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">🥧 Distribusi Status Hari Ini</h3>
          </div>
          <div className="card-body" style={{ height: "240px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {leaveDistribution.length === 0 ? (
              <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>Belum ada data</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={leaveDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                    {leaveDistribution.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "0.8rem" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Pending approvals table */}
      {pendingLeaves.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">📋 Pengajuan Izin Menunggu Approval</h3>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Karyawan</th>
                  <th>Jenis Izin</th>
                  <th>Tanggal Mulai</th>
                  <th>Tanggal Selesai</th>
                  <th>Total Hari</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {pendingLeaves.slice(0, 10).map((leave: any) => (
                  <tr key={leave.id}>
                    <td>{leave.user_name}</td>
                    <td>{leave.leave_type_name}</td>
                    <td>{new Date(leave.start_date).toLocaleDateString("id-ID")}</td>
                    <td>{new Date(leave.end_date).toLocaleDateString("id-ID")}</td>
                    <td>{leave.total_days} hari</td>
                    <td><StatusBadge status={leave.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
