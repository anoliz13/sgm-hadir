import React, { useState, useEffect } from "react";
import { api } from "../lib/api";
import {
  Search,
  Loader2,
  Check,
  X,
  Filter,
  Calendar,
  FileText,
} from "lucide-react";
import toast from "react-hot-toast";

interface LeaveRequest {
  id: string;
  user_nik: string;
  user_name: string;
  leave_type_name: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string | null;
  attachment_url: string | null;
  status: string;
  approver_name: string | null;
  approver_note: string | null;
  created_at: string;
}

export default function LeaveApprovalPage() {
  const [loading, setLoading] = useState(false);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);

  // Filters
  const [statusFilter, setStatusFilter] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");

  // Approval Modal
  const [showModal, setShowModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | "detail" | null>(
    null
  );
  const [approverNote, setApproverNote] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchLeaves();
  }, [statusFilter]);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (searchQuery) params.append("search", searchQuery);

      const res = await api.get(`/admin/leaves?${params.toString()}`);
      if (res.data.success) {
        setLeaves(res.data.data || []);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal mengambil data cuti");
    } finally {
      setLoading(false);
    }
  };

  const openActionModal = (leave: LeaveRequest, action: "approve" | "reject" | "detail") => {
    setSelectedLeave(leave);
    setActionType(action);
    setApproverNote("");
    setShowModal(true);
  };

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeave || !actionType) return;

    if (actionType === "reject" && !approverNote.trim()) {
      toast.error("Alasan penolakan harus diisi");
      return;
    }

    setProcessing(true);
    try {
      const status = actionType === "approve" ? "approved" : "rejected";
      await api.put(`/admin/leaves/${selectedLeave.id}/status`, {
        status,
        approver_note: approverNote || null,
      });

      toast.success(
        `Permohonan berhasil di${actionType === "approve" ? "setujui" : "tolak"}`
      );
      setShowModal(false);
      fetchLeaves();
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
      default:
        return <span className="badge badge-warning">Menunggu</span>;
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">✉️ Approval Izin & Cuti</h1>
        <p className="page-subtitle">Kelola pengajuan izin dan cuti karyawan</p>
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
                <option value="approved">Disetujui</option>
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
                    onClick={fetchLeaves}
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
                <th>Tipe</th>
                <th>Periode</th>
                <th>Alasan</th>
                <th>Status</th>
                <th style={{ width: "120px", textAlign: "center" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "40px 0" }}>
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
              ) : leaves.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "40px 0" }}>
                    <div style={{ color: "var(--color-text-secondary)" }}>
                      Tidak ada permohonan yang ditemukan
                    </div>
                  </td>
                </tr>
              ) : (
                leaves.map((leave, index) => (
                  <tr key={leave.id}>
                    <td>{index + 1}</td>
                    <td>{new Date(leave.created_at).toLocaleDateString("id-ID")}</td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{leave.user_name}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                        {leave.user_nik}
                      </div>
                    </td>
                    <td>{leave.leave_type_name}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.85rem" }}>
                        <Calendar size={14} style={{ color: "var(--color-text-muted)" }} />
                        {new Date(leave.start_date).toLocaleDateString("id-ID")} - {new Date(leave.end_date).toLocaleDateString("id-ID")}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--color-primary)", marginTop: "2px", fontWeight: 500 }}>
                        ({leave.total_days} hari)
                      </div>
                    </td>
                    <td>
                      <div
                        style={{
                          fontSize: "0.85rem",
                          maxWidth: "200px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={leave.reason || "-"}
                      >
                        {leave.reason || "-"}
                      </div>
                    </td>
                    <td>
                      {getStatusBadge(leave.status)}
                      {leave.approver_name && (
                        <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", marginTop: "4px" }}>
                          Oleh: {leave.approver_name}
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      {leave.status === "pending" ? (
                        <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                          <button
                            className="btn btn-primary btn-icon"
                            style={{ padding: "6px" }}
                            onClick={() => openActionModal(leave, "detail")}
                            title="Detail"
                          >
                            <FileText size={16} />
                          </button>
                          <button
                            className="btn btn-success btn-icon"
                            style={{ padding: "6px" }}
                            onClick={() => openActionModal(leave, "approve")}
                            title="Setujui"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            className="btn btn-danger btn-icon"
                            style={{ padding: "6px" }}
                            onClick={() => openActionModal(leave, "reject")}
                            title="Tolak"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <button
                            className="btn btn-primary btn-icon"
                            style={{ padding: "6px" }}
                            onClick={() => openActionModal(leave, "detail")}
                            title="Detail"
                          >
                            <FileText size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && selectedLeave && actionType && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: "550px" }}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {actionType === "approve" ? (
                  <Check size={20} className="text-success" />
                ) : actionType === "reject" ? (
                  <X size={20} className="text-danger" />
                ) : (
                  <FileText size={20} className="text-primary" />
                )}
                {actionType === "approve" ? "Setujui Permohonan" : actionType === "reject" ? "Tolak Permohonan" : "Detail Permohonan Izin"}
              </h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ padding: "16px 24px", background: "var(--color-bg)", borderBottom: "1px solid var(--color-border-light)" }}>
              <div style={{ fontWeight: 600, fontSize: "1.1rem" }}>{selectedLeave.user_name}</div>
              <div style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)", marginTop: "4px" }}>
                Mengajukan <strong>{selectedLeave.leave_type_name}</strong> selama <strong>{selectedLeave.total_days} hari</strong>
                <br/>({new Date(selectedLeave.start_date).toLocaleDateString("id-ID")} - {new Date(selectedLeave.end_date).toLocaleDateString("id-ID")})
              </div>
            </div>

            {actionType === "detail" ? (
              <div>
                <div className="modal-body" style={{ maxHeight: "60vh", overflowY: "auto" }}>
                  <div style={{ marginBottom: "16px" }}>
                    <div style={{ fontWeight: 600, marginBottom: "4px", fontSize: "0.9rem" }}>Status</div>
                    <div>{getStatusBadge(selectedLeave.status)}</div>
                  </div>
                  
                  <div style={{ marginBottom: "16px" }}>
                    <div style={{ fontWeight: 600, marginBottom: "4px", fontSize: "0.9rem" }}>Alasan / Keterangan</div>
                    <div style={{ background: "var(--color-bg)", padding: "12px", borderRadius: "8px", fontSize: "0.95rem" }}>
                      {selectedLeave.reason || "Tidak ada keterangan"}
                    </div>
                  </div>

                  {selectedLeave.attachment_url && (
                    <div style={{ marginBottom: "16px" }}>
                      <div style={{ fontWeight: 600, marginBottom: "8px", fontSize: "0.9rem" }}>Lampiran / Bukti</div>
                      <div style={{ border: "1px solid var(--color-border-light)", borderRadius: "8px", overflow: "hidden" }}>
                        <img 
                          src={selectedLeave.attachment_url.startsWith('http') ? selectedLeave.attachment_url : `http://localhost:8080${selectedLeave.attachment_url}`} 
                          alt="Lampiran" 
                          style={{ width: "100%", maxHeight: "300px", objectFit: "contain", background: "#f8f9fa", display: "block" }} 
                          onError={(e) => {
                            // Fallback if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.parentElement!.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--color-text-muted)"><p>Gagal memuat gambar atau file bukan gambar.</p><a href="${selectedLeave.attachment_url}" target="_blank" class="btn btn-primary" style="margin-top: 10px; display: inline-flex"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> Buka File Lampiran</a></div>`;
                          }}
                        />
                        <div style={{ padding: "10px", background: "#fff", borderTop: "1px solid var(--color-border-light)", textAlign: "center" }}>
                          <a href={selectedLeave.attachment_url.startsWith('http') ? selectedLeave.attachment_url : `http://localhost:8080${selectedLeave.attachment_url}`} target="_blank" rel="noreferrer" className="text-primary" style={{ fontWeight: 500, textDecoration: "none" }}>
                            Buka Lampiran di Tab Baru
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedLeave.approver_note && (
                     <div style={{ marginBottom: "16px" }}>
                       <div style={{ fontWeight: 600, marginBottom: "4px", fontSize: "0.9rem" }}>Catatan Pemeriksa ({selectedLeave.approver_name})</div>
                       <div style={{ background: "var(--color-bg)", padding: "12px", borderRadius: "8px", fontSize: "0.95rem", fontStyle: "italic" }}>
                         "{selectedLeave.approver_note}"
                       </div>
                     </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>
                    Tutup
                  </button>
                  {selectedLeave.status === "pending" && (
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button className="btn btn-danger" onClick={() => setActionType("reject")}>
                        Tolak
                      </button>
                      <button className="btn btn-success" onClick={() => setActionType("approve")}>
                        Setujui
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <form onSubmit={handleAction}>
                <div className="modal-body">
                  <div className="form-group">
                    <label className="form-label">
                      {actionType === "approve" ? "Catatan Tambahan (Opsional)" : "Alasan Penolakan (Wajib)"}
                    </label>
                    <textarea
                      className="form-input"
                      rows={3}
                      placeholder={actionType === "approve" ? "Tambahkan pesan untuk karyawan..." : "Berikan alasan mengapa permohonan ini ditolak..."}
                      value={approverNote}
                      onChange={(e) => setApproverNote(e.target.value)}
                      required={actionType === "reject"}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-ghost" onClick={() => {
                    if (selectedLeave?.status === "pending") {
                      setActionType("detail");
                    } else {
                      setShowModal(false);
                    }
                  }}>
                    Batal
                  </button>
                  <button 
                    type="submit" 
                    className={`btn btn-${actionType === "approve" ? "success" : "danger"}`} 
                    disabled={processing}
                  >
                    {processing ? "Memproses..." : actionType === "approve" ? "Setujui Sekarang" : "Tolak Permohonan"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
