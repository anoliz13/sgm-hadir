import React, { useState, useEffect } from "react";
import { api } from "../lib/api";
import {
  Search,
  Loader2,
  Check,
  X,
  Filter,
  Calendar,
  Clock,
} from "lucide-react";
import toast from "react-hot-toast";

interface OvertimeRequest {
  id: string;
  user_id: string;
  user_name: string;
  branch_name: string;
  date: string;
  estimated_start: string;
  estimated_end: string;
  actual_start: string | null;
  actual_end: string | null;
  actual_hours: number | null;
  reason: string | null;
  status: string;
  approver_name: string | null;
  approver_note: string | null;
  created_at: string;
}

export default function OvertimeApprovalPage() {
  const [loading, setLoading] = useState(false);
  const [overtimes, setOvertimes] = useState<OvertimeRequest[]>([]);

  // Filters
  const [statusFilter, setStatusFilter] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");

  // Approval Modal
  const [showModal, setShowModal] = useState(false);
  const [selectedOvertime, setSelectedOvertime] = useState<OvertimeRequest | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [approverNote, setApproverNote] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchOvertimes();
  }, [statusFilter]);

  const fetchOvertimes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (searchQuery) params.append("search", searchQuery);

      const res = await api.get(`/admin/overtimes?${params.toString()}`);
      if (res.data.success) {
        setOvertimes(res.data.data || []);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal mengambil data lembur");
    } finally {
      setLoading(false);
    }
  };

  const openActionModal = (overtime: OvertimeRequest, action: "approve" | "reject") => {
    setSelectedOvertime(overtime);
    setActionType(action);
    setApproverNote("");
    setShowModal(true);
  };

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOvertime || !actionType) return;

    if (actionType === "reject" && !approverNote.trim()) {
      toast.error("Alasan penolakan harus diisi");
      return;
    }

    setProcessing(true);
    try {
      const status = actionType === "approve" ? "approved" : "rejected";
      await api.put(`/admin/overtimes/${selectedOvertime.id}/status`, {
        status,
        approver_note: approverNote || null,
      });

      toast.success(
        `Ajuan lembur berhasil di${actionType === "approve" ? "setujui" : "tolak"}`
      );
      setShowModal(false);
      fetchOvertimes();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal memproses permohonan");
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <span className="badge badge-success">Disetujui</span>;
      case "rejected":
        return <span className="badge badge-danger">Ditolak</span>;
      case "completed":
        return <span className="badge" style={{ backgroundColor: "#8B5CF6", color: "white" }}>Selesai</span>;
      default:
        return <span className="badge badge-warning">Menunggu</span>;
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">🌙 Approval Lembur</h1>
        <p className="page-subtitle">Kelola pengajuan lembur karyawan</p>
      </div>

      <div className="card" style={{ marginBottom: "20px" }}>
        <div className="card-header">
          <h3 className="card-title">
            <Filter size={16} style={{ marginRight: "8px" }} />
            Filter
          </h3>
        </div>
        <div className="card-body">
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            <div className="form-group" style={{ marginBottom: 0, minWidth: "200px" }}>
              <label className="form-label">Status Permohonan</label>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="pending">Menunggu Persetujuan</option>
                <option value="approved">Disetujui (Belum Check-in)</option>
                <option value="completed">Selesai (Sudah Check-out)</option>
                <option value="rejected">Ditolak</option>
                <option value="all">Semua Status</option>
              </select>
            </div>
            <div style={{ flex: 1, minWidth: "300px" }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Pencarian</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <div style={{ position: "relative", flex: 1 }}>
                    <Search
                      size={16}
                      style={{
                        position: "absolute",
                        left: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "var(--color-text-muted)",
                      }}
                    />
                    <input
                      type="text"
                      className="form-input"
                      style={{ paddingLeft: "36px" }}
                      placeholder="Cari nama karyawan..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={fetchOvertimes}
                    disabled={loading}
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : "Cari"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: "40px" }}>No</th>
                <th>Tgl Pengajuan</th>
                <th>Karyawan</th>
                <th>Tgl Lembur</th>
                <th>Jam Estimasi</th>
                <th>Jam Aktual</th>
                <th>Alasan</th>
                <th>Status</th>
                <th style={{ width: "120px", textAlign: "center" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "40px 0" }}>
                    <Loader2
                      size={32}
                      className="animate-spin"
                      style={{ margin: "0 auto", color: "var(--color-primary)" }}
                    />
                    <div style={{ marginTop: "12px", color: "var(--color-text-secondary)" }}>
                      Memuat data...
                    </div>
                  </td>
                </tr>
              ) : overtimes.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "40px 0" }}>
                    <div style={{ color: "var(--color-text-secondary)" }}>
                      Tidak ada permohonan lembur yang ditemukan
                    </div>
                  </td>
                </tr>
              ) : (
                overtimes.map((overtime, index) => (
                  <tr key={overtime.id}>
                    <td>{index + 1}</td>
                    <td>{new Date(overtime.created_at).toLocaleDateString("id-ID")}</td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{overtime.user_name}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                        Cabang: {overtime.branch_name}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.85rem" }}>
                        <Calendar size={14} style={{ color: "var(--color-text-muted)" }} />
                        {new Date(overtime.date).toLocaleDateString("id-ID")}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.85rem" }}>
                        <Clock size={14} style={{ color: "var(--color-primary)" }} />
                        {overtime.estimated_start} - {overtime.estimated_end}
                      </div>
                    </td>
                    <td>
                      {overtime.actual_start ? (
                        <div style={{ fontSize: "0.85rem" }}>
                          {new Date(overtime.actual_start).toLocaleTimeString("id-ID", {hour: '2-digit', minute:'2-digit'})} - 
                          {overtime.actual_end ? new Date(overtime.actual_end).toLocaleTimeString("id-ID", {hour: '2-digit', minute:'2-digit'}) : " ??"}
                          {overtime.actual_hours && (
                            <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "2px" }}>
                              Total: {overtime.actual_hours.toFixed(1)} jam
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Belum Mulai</span>
                      )}
                    </td>
                    <td>
                      <div
                        style={{
                          fontSize: "0.85rem",
                          maxWidth: "150px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={overtime.reason || "-"}
                      >
                        {overtime.reason || "-"}
                      </div>
                    </td>
                    <td>
                      {getStatusBadge(overtime.status)}
                      {overtime.approver_name && (
                        <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", marginTop: "4px" }}>
                          Oleh: {overtime.approver_name}
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      {overtime.status === "pending" ? (
                        <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                          <button
                            className="btn btn-success btn-icon"
                            style={{ padding: "6px" }}
                            onClick={() => openActionModal(overtime, "approve")}
                            title="Setujui"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            className="btn btn-danger btn-icon"
                            style={{ padding: "6px" }}
                            onClick={() => openActionModal(overtime, "reject")}
                            title="Tolak"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && selectedOvertime && actionType && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: "500px" }}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {actionType === "approve" ? (
                  <Check size={20} className="text-success" />
                ) : (
                  <X size={20} className="text-danger" />
                )}
                {actionType === "approve" ? "Setujui Ajuan Lembur" : "Tolak Ajuan Lembur"}
              </h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ padding: "16px 24px", background: "var(--color-bg)", borderBottom: "1px solid var(--color-border-light)" }}>
              <div style={{ fontWeight: 600, fontSize: "1.1rem" }}>{selectedOvertime.user_name}</div>
              <div style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)", marginTop: "4px" }}>
                Tanggal: <strong>{new Date(selectedOvertime.date).toLocaleDateString("id-ID")}</strong>
                <br/>Estimasi Jam: <strong>{selectedOvertime.estimated_start} - {selectedOvertime.estimated_end}</strong>
                <br/>Alasan: <em>{selectedOvertime.reason}</em>
              </div>
            </div>

            <form onSubmit={handleAction}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">
                    {actionType === "approve" ? "Catatan Tambahan (Opsional)" : "Alasan Penolakan (Wajib)"}
                  </label>
                  <textarea
                    className="form-input"
                    rows={3}
                    placeholder={actionType === "approve" ? "Tambahkan pesan untuk karyawan..." : "Berikan alasan mengapa lembur ini ditolak..."}
                    value={approverNote}
                    onChange={(e) => setApproverNote(e.target.value)}
                    required={actionType === "reject"}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>
                  Batal
                </button>
                <button 
                  type="submit" 
                  className={`btn btn-${actionType === "approve" ? "success" : "danger"}`} 
                  disabled={processing}
                >
                  {processing ? "Memproses..." : actionType === "approve" ? "Setujui Sekarang" : "Tolak Ajuan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
