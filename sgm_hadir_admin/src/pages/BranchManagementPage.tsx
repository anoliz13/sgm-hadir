/**
 * Branch Management Page
 */

import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { Branch, WorkSchedule } from "../lib/types";
import {
  Building2,
  Plus,
  Edit,
  MapPin,
  Clock,
  Loader2,
  X,
  Save,
  ToggleLeft,
  ToggleRight,
  Camera,
} from "lucide-react";
import toast from "react-hot-toast";

const DEFAULT_SCHEDULE: WorkSchedule = {
  workDays: [1, 2, 3, 4, 5],
  checkInTime: "08:00",
  checkOutTime: "17:00",
  lateToleranceMinutes: 15,
};

export default function BranchManagementPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [saving, setSaving] = useState(false);

  // Form
  const [form, setForm] = useState({
    name: "",
    code: "",
    address: "",
    latitude: -6.2088,
    longitude: 106.8456,
    radiusMeters: 100,
    timezone: "Asia/Jakarta",
    workSchedule: { ...DEFAULT_SCHEDULE },
    requireSelfie: false,
    isActive: true,
  });

  useEffect(() => {
    loadBranches();
  }, []);

  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  const engDayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const loadBranches = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/branches');
      const branchesData = res.data.data || [];
      const mapped = branchesData.map((b: any) => {
        // Map string days back to indices
        const workDays = (b.work_days || []).map((d: string) => engDayNames.indexOf(d)).filter((d: number) => d !== -1);
        
        return {
          id: b.id,
          name: b.name,
          code: b.code || "", // Backend might not have code yet
          address: b.address,
          latitude: b.latitude,
          longitude: b.longitude,
          radiusMeters: b.radius_meters,
          timezone: b.timezone,
          workSchedule: {
            checkInTime: b.work_start ? b.work_start.substring(0, 5) : "08:00",
            checkOutTime: b.work_end ? b.work_end.substring(0, 5) : "17:00",
            lateToleranceMinutes: b.late_tolerance_minutes,
            workDays: workDays.length > 0 ? workDays : [1, 2, 3, 4, 5],
          },
          requireSelfie: b.require_selfie,
          isActive: b.is_active,
          createdAt: b.created_at,
          updatedAt: b.updated_at,
        };
      });
      setBranches(mapped);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal memuat data cabang");
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingBranch(null);
    setForm({
      name: "",
      code: "",
      address: "",
      latitude: -6.2088,
      longitude: 106.8456,
      radiusMeters: 100,
      timezone: "Asia/Jakarta",
      workSchedule: { ...DEFAULT_SCHEDULE },
      requireSelfie: false,
      isActive: true,
    });
    setShowModal(true);
  };

  const openEditModal = (branch: Branch) => {
    setEditingBranch(branch);
    setForm({
      name: branch.name,
      code: branch.code,
      address: branch.address || "",
      latitude: branch.latitude,
      longitude: branch.longitude,
      radiusMeters: branch.radiusMeters,
      timezone: branch.timezone,
      workSchedule: branch.workSchedule ? { ...branch.workSchedule } : { ...DEFAULT_SCHEDULE },
      requireSelfie: branch.requireSelfie,
      isActive: branch.isActive,
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Map indices back to string days
      const workDaysStr = form.workSchedule.workDays.map(d => engDayNames[d]);

      // payload matches what the Go backend expects
      const payload = {
        name: form.name,
        address: form.address,
        latitude: form.latitude,
        longitude: form.longitude,
        radius_meters: form.radiusMeters,
        timezone: form.timezone,
        require_selfie: form.requireSelfie,
        is_active: form.isActive,
        work_start: form.workSchedule.checkInTime + ":00",
        work_end: form.workSchedule.checkOutTime + ":00",
        late_tolerance_minutes: form.workSchedule.lateToleranceMinutes,
        work_days: workDaysStr,
      };

      if (editingBranch) {
        await api.put(`/admin/branches/${editingBranch.id}`, payload);
        toast.success(`Cabang ${form.name} berhasil diperbarui!`);
      } else {
        await api.post('/admin/branches', payload);
        toast.success(`Cabang ${form.name} berhasil ditambahkan!`);
      }
      setShowModal(false);
      loadBranches();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal menyimpan cabang");
    } finally {
      setSaving(false);
    }
  };

  const toggleWorkDay = (day: number) => {
    const days = form.workSchedule.workDays.includes(day)
      ? form.workSchedule.workDays.filter((d) => d !== day)
      : [...form.workSchedule.workDays, day].sort();
    setForm({
      ...form,
      workSchedule: { ...form.workSchedule, workDays: days },
    });
  };

  return (
    <div className="page-container">
      <div
        className="page-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h1 className="page-title">Manajemen Cabang</h1>
          <p className="page-subtitle">
            {branches.length} cabang terdaftar
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <Plus size={18} />
          Tambah Cabang
        </button>
      </div>

      {/* Branch Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
          gap: "16px",
        }}
      >
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="card"
                style={{ height: "200px" }}
              >
                <div className="card-body">
                  <div
                    className="skeleton"
                    style={{ height: "24px", width: "60%", marginBottom: "12px" }}
                  />
                  <div
                    className="skeleton"
                    style={{ height: "16px", width: "80%", marginBottom: "8px" }}
                  />
                  <div
                    className="skeleton"
                    style={{ height: "16px", width: "40%" }}
                  />
                </div>
              </div>
            ))
          : branches.map((branch) => (
              <div key={branch.id} className="card">
                <div className="card-body">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "12px",
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          fontSize: "1.125rem",
                          fontWeight: 600,
                          marginBottom: "2px",
                        }}
                      >
                        {branch.name}
                      </h3>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--color-text-muted)",
                          fontFamily: "monospace",
                        }}
                      >
                        {branch.code}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: "4px" }}>
                      <span
                        className={`badge ${
                          branch.isActive ? "success" : "danger"
                        }`}
                      >
                        {branch.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                      fontSize: "0.8125rem",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <MapPin size={14} />
                      <span>{branch.address || "Alamat belum diisi"}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Clock size={14} />
                      <span>
                        {branch.workSchedule?.checkInTime || "08:00"} -{" "}
                        {branch.workSchedule?.checkOutTime || "17:00"} (toleransi{" "}
                        {branch.workSchedule?.lateToleranceMinutes || 15} mnt)
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Building2 size={14} />
                      <span>
                        Radius geofence: {branch.radiusMeters}m
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Camera size={14} />
                      <span>
                        Selfie: {branch.requireSelfie ? "Wajib" : "Opsional"}
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "4px",
                      marginTop: "16px",
                      paddingTop: "12px",
                      borderTop: "1px solid var(--color-border-light)",
                    }}
                  >
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => openEditModal(branch)}
                    >
                      <Edit size={14} />
                      Edit
                    </button>
                    <a
                      href={`https://maps.google.com/?q=${branch.latitude},${branch.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline btn-sm"
                    >
                      <MapPin size={14} />
                      Lihat di Maps
                    </a>
                  </div>
                </div>
              </div>
            ))}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div className="modal" style={{ maxWidth: "640px" }}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingBranch ? "Edit Cabang" : "Tambah Cabang Baru"}
              </h3>
              <button
                className="btn btn-ghost btn-icon"
                onClick={() => setShowModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                  }}
                >
                  <div className="form-group">
                    <label className="form-label">Nama Cabang *</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      placeholder="SGM Cabang Jakarta"
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Kode Cabang *</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      placeholder="SGM-JKT"
                      value={form.code}
                      onChange={(e) =>
                        setForm({ ...form, code: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Alamat</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Jl. Contoh No. 123, Kota"
                    value={form.address}
                    onChange={(e) =>
                      setForm({ ...form, address: e.target.value })
                    }
                  />
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: "12px",
                  }}
                >
                  <div className="form-group">
                    <label className="form-label">Latitude *</label>
                    <input
                      type="number"
                      step="any"
                      className="form-input"
                      required
                      value={form.latitude}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          latitude: parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Longitude *</label>
                    <input
                      type="number"
                      step="any"
                      className="form-input"
                      required
                      value={form.longitude}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          longitude: parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      Radius Geofence (m)
                    </label>
                    <input
                      type="range"
                      min={50}
                      max={500}
                      step={10}
                      value={form.radiusMeters}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          radiusMeters: parseInt(e.target.value),
                        })
                      }
                      style={{ width: "100%", marginTop: "4px" }}
                    />
                    <div
                      style={{
                        textAlign: "center",
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        color: "var(--color-primary)",
                      }}
                    >
                      {form.radiusMeters} meter
                    </div>
                  </div>
                </div>

                {/* Work Schedule */}
                <h4
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    marginTop: "16px",
                    marginBottom: "8px",
                  }}
                >
                  Jadwal Kerja
                </h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: "12px",
                  }}
                >
                  <div className="form-group">
                    <label className="form-label">Jam Masuk</label>
                    <input
                      type="time"
                      className="form-input"
                      value={form.workSchedule.checkInTime}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          workSchedule: {
                            ...form.workSchedule,
                            checkInTime: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Jam Pulang</label>
                    <input
                      type="time"
                      className="form-input"
                      value={form.workSchedule.checkOutTime}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          workSchedule: {
                            ...form.workSchedule,
                            checkOutTime: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Toleransi Telat (mnt)</label>
                    <input
                      type="number"
                      className="form-input"
                      min={0}
                      max={60}
                      value={form.workSchedule.lateToleranceMinutes}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          workSchedule: {
                            ...form.workSchedule,
                            lateToleranceMinutes: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                    />
                  </div>
                </div>

                {/* Work Days */}
                <div className="form-group">
                  <label className="form-label">Hari Kerja Aktif</label>
                  <div style={{ display: "flex", gap: "6px" }}>
                    {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                      <button
                        key={day}
                        type="button"
                        className={`btn btn-sm ${
                          form.workSchedule.workDays.includes(day)
                            ? "btn-primary"
                            : "btn-outline"
                        }`}
                        onClick={() => toggleWorkDay(day)}
                        style={{ minWidth: "42px" }}
                      >
                        {dayNames[day]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selfie toggle */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginTop: "8px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setForm({ ...form, requireSelfie: !form.requireSelfie })
                    }
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    {form.requireSelfie ? (
                      <ToggleRight
                        size={28}
                        style={{ color: "var(--color-success)" }}
                      />
                    ) : (
                      <ToggleLeft
                        size={28}
                        style={{ color: "var(--color-text-muted)" }}
                      />
                    )}
                  </button>
                  <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>
                    Foto selfie wajib saat absen
                  </span>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowModal(false)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  {saving ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
