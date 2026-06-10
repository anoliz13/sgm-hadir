/**
 * Attendance Log Page - Detail Absensi
 */

import React, { useState, useEffect } from "react";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import type { Branch } from "../lib/types";
import {
  Download,
  FileSpreadsheet,
  Search,
  Loader2,
  Calendar,
  Filter,
  Edit2,
  X,
  Check,
  Save,
} from "lucide-react";
import toast from "react-hot-toast";

interface AttendanceLog {
  id: string;
  user_nik: string;
  user_name: string;
  branch_name: string;
  type: string;
  status: string;
  created_at: string;
  notes: string | null;
  is_manual_entry: boolean;
  manual_reason: string | null;
  latitude: number;
  longitude: number;
  selfie_url: string | null;
}

export default function MarketingVisitPage() {
  const { userData } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Filters
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toLocaleDateString("sv-SE");
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toLocaleDateString("sv-SE");
  });
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Data
  const [logs, setLogs] = useState<AttendanceLog[]>([]);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLog, setEditingLog] = useState<AttendanceLog | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editCreatedAt, setEditCreatedAt] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Photo Modal
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    const loadBranches = async () => {
      try {
        const res = await api.get('/admin/branches');
        if (res.data.success) {
          setBranches(res.data.data);
        }
      } catch (err) {
        console.error("Failed to load branches", err);
      }
    };
    loadBranches();
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);
      if (selectedBranch !== "all") params.append("branch_id", selectedBranch);
      if (searchQuery) params.append("search", searchQuery);
      params.append("type", "visit");

      const res = await api.get(`/admin/attendances?${params.toString()}`);
      if (res.data.success) {
        setLogs(res.data.data || []);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal mengambil data");
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);
      if (selectedBranch !== "all") params.append("branch_id", selectedBranch);
      if (searchQuery) params.append("search", searchQuery);
      params.append("type", "visit");

      const res = await api.get(`/admin/attendances/export/excel?${params.toString()}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      const link = document.createElement('a');
      link.href = url;
      const fileName = `Kunjungan_Marketing_${startDate}_${endDate}.xlsx`;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success("File Excel berhasil diunduh");
    } catch (err: any) {
      toast.error("Gagal mengunduh excel");
    } finally {
      setExporting(false);
    }
  };

  const openEditModal = (log: AttendanceLog) => {
    setEditingLog(log);
    setEditStatus(log.status);
    setEditNotes(log.notes || log.manual_reason || "");
    
    // Convert UTC to local datetime-local format
    const d = new Date(log.created_at);
    // Adjust for timezone offset to display correctly in datetime-local
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    setEditCreatedAt(d.toISOString().slice(0, 16));
    
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLog) return;
    
    setSavingEdit(true);
    try {
      // Convert back to UTC for API
      const d = new Date(editCreatedAt);
      
      await api.put(`/admin/attendances/${editingLog.id}`, {
        status: editStatus,
        notes: editNotes,
        is_manual_entry: true,
        manual_reason: "Edited by admin",
        created_at: d.toISOString()
      });
      
      toast.success("Log absensi berhasil diubah");
      setShowEditModal(false);
      fetchLogs(); // Reload data
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal mengubah absensi");
    } finally {
      setSavingEdit(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "on_time":
        return <span className="badge badge-success">Tepat Waktu</span>;
      case "late":
        return <span className="badge badge-warning">Terlambat</span>;
      default:
        return <span className="badge badge-default">{status}</span>;
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">🗺️ Kunjungan Marketing</h1>
        <p className="page-subtitle">
          Data riwayat kunjungan ke lokasi klien/luar kantor
        </p>
      </div>

      {/* Filter Card */}
      <div className="card" style={{ marginBottom: "20px" }}>
        <div className="card-header">
          <h3 className="card-title">
            <Filter size={16} style={{ marginRight: "8px" }} />
            Pencarian & Filter
          </h3>
        </div>
        <div className="card-body">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "16px" }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Tanggal Mulai</label>
              <input type="date" className="form-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Tanggal Selesai</label>
              <input type="date" className="form-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Cabang</label>
              <select className="form-select" value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)}>
                <option value="all">Semua Cabang</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ position: "relative", flex: 1, maxWidth: "320px" }}>
              <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
              <input type="text" className="form-input" style={{ paddingLeft: "36px" }} placeholder="Cari nama atau NIK..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <button className="btn btn-primary btn-lg" onClick={fetchLogs} disabled={loading}>
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
              {loading ? "Memproses..." : "Tampilkan Data"}
            </button>
            <button className="btn btn-success btn-lg" onClick={handleExportExcel} disabled={exporting}>
              {exporting ? <Loader2 size={18} className="animate-spin" /> : <FileSpreadsheet size={18} />}
              Export Excel
            </button>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="card">
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: "40px" }}>No</th>
                <th>Waktu</th>
                <th>Karyawan</th>
                <th>Tipe & Cabang</th>
                <th>Lokasi</th>
                <th>Catatan</th>
                <th>Foto</th>
                <th>Status</th>
                <th style={{ width: "80px", textAlign: "center" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "40px 0" }}>
                    <Loader2 size={32} className="animate-spin" style={{ margin: "0 auto", color: "var(--color-primary)" }} />
                    <div style={{ marginTop: "12px", color: "var(--color-text-secondary)" }}>Memuat data absensi...</div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "40px 0" }}>
                    <div style={{ color: "var(--color-text-secondary)" }}>Tidak ada data absensi ditemukan</div>
                  </td>
                </tr>
              ) : (
                logs.map((log, index) => (
                  <tr key={log.id}>
                    <td>{index + 1}</td>
                    <td>{new Date(log.created_at).toLocaleString('id-ID')}</td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{log.user_name}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{log.user_nik}</div>
                    </td>
                    <td>
                      {log.type === "visit_in" ? (
                        <span style={{ color: "var(--color-primary)", fontWeight: 600 }}>Visit In</span>
                      ) : log.type === "visit_out" ? (
                        <span style={{ color: "var(--color-secondary)", fontWeight: 600 }}>Visit Out</span>
                      ) : (
                        <span>{log.type}</span>
                      )}
                      <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "4px" }}>
                        {log.branch_name}
                      </div>
                    </td>
                    <td>
                      {log.latitude && log.longitude ? (
                        <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${log.latitude},${log.longitude}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ color: "var(--color-primary)", fontSize: "0.8rem", textDecoration: "underline" }}
                        >
                          {log.latitude.toFixed(5)},<br/>{log.longitude.toFixed(5)}
                        </a>
                      ) : (
                        <span style={{ color: "var(--color-text-muted)", fontSize: "0.8rem" }}>Tidak ada lokasi</span>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: "0.8rem", maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={log.notes || log.manual_reason || "-"}>
                        {log.notes || log.manual_reason || "-"}
                      </div>
                    </td>
                    <td>
                      {log.selfie_url ? (
                        <img 
                          src={log.selfie_url} 
                          alt="Selfie" 
                          style={{ width: "40px", height: "40px", borderRadius: "8px", objectFit: "cover", cursor: "pointer", border: "1px solid var(--color-border)" }}
                          onClick={() => { setSelectedPhoto(log.selfie_url); setShowPhotoModal(true); }}
                        />
                      ) : (
                        <span style={{ color: "var(--color-text-muted)", fontSize: "0.75rem" }}>No Photo</span>
                      )}
                    </td>
                    <td>{getStatusBadge(log.status)}</td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        className="btn btn-ghost"
                        style={{ padding: "6px" }}
                        onClick={() => openEditModal(log)}
                        title="Edit Absensi"
                      >
                        <Edit2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && editingLog && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: "500px" }}>
            <div className="modal-header" style={{ background: "var(--color-surface)", borderBottom: "1px solid var(--color-border-light)" }}>
              <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit2 size={20} className="text-primary" />
                Edit Kunjungan
              </h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowEditModal(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ padding: "16px 24px", background: "var(--color-primary-50)", borderBottom: "1px solid var(--color-border-light)", display: "flex", alignItems: "center", gap: "12px" }}>
              <div className="feed-avatar" style={{ width: "42px", height: "42px", fontSize: "1rem" }}>
                {editingLog.user_name.charAt(0)}
              </div>
              <div>
                <div style={{ fontWeight: 600, color: "var(--color-text)", fontSize: "0.95rem" }}>{editingLog.user_name}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span>{editingLog.user_nik}</span>
                  <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--color-border)' }}></span>
                  <span style={{ fontWeight: 500 }}>{editingLog.branch_name}</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Waktu Absen</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={editCreatedAt}
                    onChange={(e) => setEditCreatedAt(e.target.value)}
                    required
                  />
                  <div className="form-hint">Format waktu: disesuaikan dengan zona waktu perangkat Anda.</div>
                </div>

                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    required
                  >
                    <option value="on_time">Tepat Waktu</option>
                    <option value="late">Terlambat</option>
                    <option value="early_leave">Pulang Awal</option>
                    <option value="half_day">Setengah Hari</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Catatan / Alasan Koreksi</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    placeholder="Masukkan alasan mengapa data absen diubah..."
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowEditModal(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingEdit}>
                  <Save size={18} style={{ marginRight: "6px" }} />
                  {savingEdit ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Photo Modal */}
      {showPhotoModal && selectedPhoto && (
        <div className="modal-overlay" onClick={() => setShowPhotoModal(false)}>
          <div className="modal" style={{ maxWidth: "500px", padding: "8px", background: "transparent", boxShadow: "none" }} onClick={e => e.stopPropagation()}>
            <div style={{ position: "relative" }}>
              <button 
                className="btn btn-ghost btn-icon" 
                style={{ position: "absolute", top: "8px", right: "8px", background: "rgba(0,0,0,0.5)", color: "white", borderRadius: "50%" }} 
                onClick={() => setShowPhotoModal(false)}
              >
                <X size={20} />
              </button>
              <img src={selectedPhoto} alt="Bukti Kunjungan" style={{ width: "100%", borderRadius: "12px", display: "block" }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
