/**
 * Shift Management Page - Kelola shift kerja dan kalender libur
 */

import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";
import { useRoleAccess } from "../hooks/useRoleAccess";
import { AlarmClock, Plus, Pencil, Trash2, Calendar, Download, Loader2, X, Check } from "lucide-react";
import toast from "react-hot-toast";

interface Shift {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  work_days: string[];
  is_active: boolean;
}

const ALL_DAYS = [
  { key: "monday",    label: "Sen" },
  { key: "tuesday",   label: "Sel" },
  { key: "wednesday", label: "Rab" },
  { key: "thursday",  label: "Kam" },
  { key: "friday",    label: "Jum" },
  { key: "saturday",  label: "Sab" },
  { key: "sunday",    label: "Min" },
];

const DEFAULT_WORK_DAYS = ["monday","tuesday","wednesday","thursday","friday"];

const fmtDays = (days: string[]): string => {
  if (!days || days.length === 0) return "-";
  if (days.length === 7) return "Setiap Hari";
  if (days.length === 5 && !days.includes("saturday") && !days.includes("sunday")) return "Sen–Jum";
  if (days.length === 6 && !days.includes("sunday")) return "Sen–Sab";
  return days.map(d => ALL_DAYS.find(x => x.key === d)?.label ?? d).join(", ");
};

interface Holiday {
  id: string;
  name: string;
  date: string;
  type: string;
}

interface Employee {
  id: string;
  name: string;
  nik: string;
}

type Tab = "shifts" | "holidays";

export default function ShiftManagementPage() {
  const { canManageShifts, canImportHolidays } = useRoleAccess();
  const [activeTab, setActiveTab] = useState<Tab>("shifts");

  // Shifts state
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loadingShifts, setLoadingShifts] = useState(false);
  const [showShiftForm, setShowShiftForm] = useState(false);
  const [editShift, setEditShift] = useState<Shift | null>(null);
  const [shiftForm, setShiftForm] = useState({ name: "", start_time: "", end_time: "", work_days: DEFAULT_WORK_DAYS as string[], is_active: true });

  // Assign shift state
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [assignForm, setAssignForm] = useState({ employee_id: "", shift_id: "", effective_date: "" });
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [savingAssign, setSavingAssign] = useState(false);

  // Holidays state
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loadingHolidays, setLoadingHolidays] = useState(false);
  const [importYear, setImportYear] = useState(new Date().getFullYear());
  const [importing, setImporting] = useState(false);
  const [showHolidayForm, setShowHolidayForm] = useState(false);
  const [holidayForm, setHolidayForm] = useState({ name: "", date: "", type: "national" });

  const fetchShifts = useCallback(async () => {
    setLoadingShifts(true);
    try {
      const res = await api.get("/admin/shifts");
      setShifts(res.data.data || []);
    } catch {
      toast.error("Gagal memuat data shift");
    } finally {
      setLoadingShifts(false);
    }
  }, []);

  const fetchHolidays = useCallback(async () => {
    setLoadingHolidays(true);
    try {
      const res = await api.get("/admin/holidays");
      setHolidays(res.data.data || []);
    } catch {
      toast.error("Gagal memuat data hari libur");
    } finally {
      setLoadingHolidays(false);
    }
  }, []);

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await api.get("/admin/employees");
      setEmployees((res.data.data || []).map((e: any) => ({ id: e.id, name: e.name, nik: e.nik })));
    } catch {}
  }, []);

  useEffect(() => {
    fetchShifts();
    fetchHolidays();
    fetchEmployees();
  }, [fetchShifts, fetchHolidays, fetchEmployees]);

  const handleSaveShift = async () => {
    try {
      if (editShift) {
        await api.put(`/admin/shifts/${editShift.id}`, shiftForm);
        toast.success("Shift berhasil diperbarui");
      } else {
        await api.post("/admin/shifts", shiftForm);
        toast.success("Shift berhasil ditambahkan");
      }
      setShowShiftForm(false);
      setEditShift(null);
      setShiftForm({ name: "", start_time: "", end_time: "", work_days: DEFAULT_WORK_DAYS, is_active: true });
      fetchShifts();
    } catch {
      toast.error("Gagal menyimpan shift");
    }
  };

  const handleDeleteShift = async (id: string) => {
    if (!confirm("Hapus shift ini?")) return;
    try {
      await api.delete(`/admin/shifts/${id}`);
      toast.success("Shift dihapus");
      fetchShifts();
    } catch {
      toast.error("Gagal menghapus shift");
    }
  };

  const handleAssignShift = async () => {
    setSavingAssign(true);
    try {
      await api.post(`/admin/employees/${assignForm.employee_id}/shift`, {
        shift_id: assignForm.shift_id,
        effective_date: assignForm.effective_date,
      });
      toast.success("Shift berhasil di-assign ke karyawan");
      setShowAssignForm(false);
      setAssignForm({ employee_id: "", shift_id: "", effective_date: "" });
    } catch {
      toast.error("Gagal assign shift");
    } finally {
      setSavingAssign(false);
    }
  };

  const handleImportHolidays = async () => {
    setImporting(true);
    try {
      const res = await api.post(`/admin/holidays/import-national?year=${importYear}`);
      const count = res.data.data?.imported ?? 0;
      toast.success(`Berhasil mengimpor ${count} hari libur nasional ${importYear}`);
      fetchHolidays();
    } catch {
      toast.error("Gagal mengimpor hari libur");
    } finally {
      setImporting(false);
    }
  };

  const handleAddHoliday = async () => {
    try {
      await api.post("/admin/holidays", holidayForm);
      toast.success("Hari libur berhasil ditambahkan");
      setShowHolidayForm(false);
      setHolidayForm({ name: "", date: "", type: "national" });
      fetchHolidays();
    } catch {
      toast.error("Gagal menambahkan hari libur");
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    if (!confirm("Hapus hari libur ini?")) return;
    try {
      await api.delete(`/admin/holidays/${id}`);
      toast.success("Hari libur dihapus");
      fetchHolidays();
    } catch {
      toast.error("Gagal menghapus hari libur");
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">⏰ Manajemen Shift & Kalender Libur</h1>
        <p className="page-subtitle">Kelola shift kerja karyawan dan hari libur nasional</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        <button
          className={`btn ${activeTab === "shifts" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("shifts")}
        >
          <AlarmClock size={16} /> Shift Kerja
        </button>
        <button
          className={`btn ${activeTab === "holidays" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("holidays")}
        >
          <Calendar size={16} /> Kalender Libur
        </button>
      </div>

      {/* SHIFTS TAB */}
      {activeTab === "shifts" && (
        <>
          <div className="card" style={{ marginBottom: "20px" }}>
            <div className="card-header">
              <h3 className="card-title">Daftar Shift</h3>
              {canManageShifts && (
                <div style={{ display: "flex", gap: "8px" }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => setShowAssignForm(true)}>
                    Assign Shift
                  </button>
                  <button className="btn btn-primary btn-sm" onClick={() => { setShowShiftForm(true); setEditShift(null); setShiftForm({ name: "", start_time: "", end_time: "", work_days: DEFAULT_WORK_DAYS, is_active: true }); }}>
                    <Plus size={14} /> Tambah Shift
                  </button>
                </div>
              )}
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {loadingShifts ? (
                <div style={{ textAlign: "center", padding: "40px" }}>
                  <Loader2 size={24} className="animate-spin" />
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Nama Shift</th>
                      <th>Hari Kerja</th>
                      <th>Jam Masuk</th>
                      <th>Jam Pulang</th>
                      <th>Status</th>
                      {canManageShifts && <th>Aksi</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {shifts.length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: "center", padding: "32px", color: "var(--color-text-muted)" }}>Belum ada shift</td></tr>
                    ) : shifts.map((s) => (
                      <tr key={s.id}>
                        <td style={{ fontWeight: 600 }}>{s.name}</td>
                        <td>
                          <div style={{ display: "flex", gap: "3px", flexWrap: "wrap" }}>
                            {ALL_DAYS.map(d => (
                              <span key={d.key} style={{
                                padding: "1px 6px", borderRadius: "4px", fontSize: "0.7rem", fontWeight: 600,
                                background: (s.work_days || []).includes(d.key) ? (d.key === "saturday" || d.key === "sunday" ? "#FEF3C7" : "var(--color-primary-50)") : "var(--color-gray-100)",
                                color: (s.work_days || []).includes(d.key) ? (d.key === "saturday" || d.key === "sunday" ? "#92400E" : "var(--color-primary)") : "var(--color-text-muted)",
                              }}>{d.label}</span>
                            ))}
                          </div>
                        </td>
                        <td>{s.start_time}</td>
                        <td>{s.end_time}</td>
                        <td>
                          <span style={{ padding: "2px 8px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: 600, background: s.is_active ? "var(--color-success-bg)" : "var(--color-gray-100)", color: s.is_active ? "var(--color-success)" : "var(--color-text-muted)" }}>
                            {s.is_active ? "Aktif" : "Tidak Aktif"}
                          </span>
                        </td>
                        {canManageShifts && (
                          <td>
                            <div style={{ display: "flex", gap: "6px" }}>
                              <button className="btn btn-secondary btn-sm" onClick={() => { setEditShift(s); setShiftForm({ name: s.name, start_time: s.start_time, end_time: s.end_time, work_days: s.work_days || DEFAULT_WORK_DAYS, is_active: s.is_active }); setShowShiftForm(true); }}>
                                <Pencil size={12} />
                              </button>
                              <button className="btn btn-danger btn-sm" onClick={() => handleDeleteShift(s.id)}>
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Shift Form Modal */}
          {showShiftForm && (
            <div className="modal-overlay" onClick={() => setShowShiftForm(false)}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>{editShift ? "Edit Shift" : "Tambah Shift Baru"}</h3>
                  <button onClick={() => setShowShiftForm(false)}><X size={18} /></button>
                </div>
                <div className="modal-body">
                  <div className="form-group">
                    <label className="form-label">Nama Shift</label>
                    <input className="form-input" value={shiftForm.name} onChange={(e) => setShiftForm(f => ({ ...f, name: e.target.value }))} placeholder="cth: Shift Pagi, Normal" />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div className="form-group">
                      <label className="form-label">Jam Masuk</label>
                      <input className="form-input" type="time" value={shiftForm.start_time} onChange={(e) => setShiftForm(f => ({ ...f, start_time: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Jam Pulang</label>
                      <input className="form-input" type="time" value={shiftForm.end_time} onChange={(e) => setShiftForm(f => ({ ...f, end_time: e.target.value }))} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Hari Kerja</label>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "6px" }}>
                      {ALL_DAYS.map(d => {
                        const active = shiftForm.work_days.includes(d.key);
                        const isWeekend = d.key === "saturday" || d.key === "sunday";
                        return (
                          <button key={d.key} type="button"
                            onClick={() => setShiftForm(f => ({
                              ...f,
                              work_days: active ? f.work_days.filter(x => x !== d.key) : [...f.work_days, d.key]
                            }))}
                            style={{
                              padding: "6px 12px", borderRadius: "6px", border: "2px solid",
                              borderColor: active ? (isWeekend ? "#F59E0B" : "var(--color-primary)") : "var(--color-border)",
                              background: active ? (isWeekend ? "#FEF3C7" : "var(--color-primary-50)") : "white",
                              color: active ? (isWeekend ? "#92400E" : "var(--color-primary)") : "var(--color-text-muted)",
                              fontWeight: active ? 700 : 400, fontSize: "0.8rem", cursor: "pointer", transition: "all 0.15s",
                            }}>
                            {d.label}
                          </button>
                        );
                      })}
                    </div>
                    <div style={{ marginTop: "6px", display: "flex", gap: "6px" }}>
                      <button type="button" className="btn btn-secondary btn-sm"
                        onClick={() => setShiftForm(f => ({ ...f, work_days: DEFAULT_WORK_DAYS }))}>
                        Sen–Jum
                      </button>
                      <button type="button" className="btn btn-secondary btn-sm"
                        onClick={() => setShiftForm(f => ({ ...f, work_days: [...DEFAULT_WORK_DAYS, "saturday"] }))}>
                        Sen–Sab
                      </button>
                      <button type="button" className="btn btn-secondary btn-sm"
                        onClick={() => setShiftForm(f => ({ ...f, work_days: ALL_DAYS.map(d => d.key) }))}>
                        Setiap Hari
                      </button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                      <input type="checkbox" checked={shiftForm.is_active} onChange={(e) => setShiftForm(f => ({ ...f, is_active: e.target.checked }))} />
                      Shift Aktif
                    </label>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setShowShiftForm(false)}>Batal</button>
                  <button className="btn btn-primary" onClick={handleSaveShift}><Check size={14} /> Simpan</button>
                </div>
              </div>
            </div>
          )}

          {/* Assign Shift Modal */}
          {showAssignForm && (
            <div className="modal-overlay" onClick={() => setShowAssignForm(false)}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>Assign Shift ke Karyawan</h3>
                  <button onClick={() => setShowAssignForm(false)}><X size={18} /></button>
                </div>
                <div className="modal-body">
                  <div className="form-group">
                    <label className="form-label">Karyawan</label>
                    <select className="form-select" value={assignForm.employee_id} onChange={(e) => setAssignForm(f => ({ ...f, employee_id: e.target.value }))}>
                      <option value="">Pilih Karyawan</option>
                      {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.nik})</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Shift</label>
                    <select className="form-select" value={assignForm.shift_id} onChange={(e) => setAssignForm(f => ({ ...f, shift_id: e.target.value }))}>
                      <option value="">Pilih Shift</option>
                      {shifts.filter(s => s.is_active).map(s => <option key={s.id} value={s.id}>{s.name} ({s.start_time}–{s.end_time})</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mulai Berlaku</label>
                    <input className="form-input" type="date" value={assignForm.effective_date} onChange={(e) => setAssignForm(f => ({ ...f, effective_date: e.target.value }))} />
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setShowAssignForm(false)}>Batal</button>
                  <button className="btn btn-primary" onClick={handleAssignShift} disabled={savingAssign}>
                    {savingAssign ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Assign
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* HOLIDAYS TAB */}
      {activeTab === "holidays" && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Kalender Hari Libur</h3>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              {canImportHolidays && (
                <>
                  <input type="number" className="form-input" style={{ width: "90px" }} value={importYear} onChange={(e) => setImportYear(Number(e.target.value))} min={2020} max={2030} />
                  <button className="btn btn-secondary btn-sm" onClick={handleImportHolidays} disabled={importing}>
                    {importing ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                    Import Libur {importYear}
                  </button>
                </>
              )}
              <button className="btn btn-primary btn-sm" onClick={() => setShowHolidayForm(true)}>
                <Plus size={14} /> Tambah Libur
              </button>
            </div>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {loadingHolidays ? (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <Loader2 size={24} className="animate-spin" />
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nama Hari Libur</th>
                    <th>Tanggal</th>
                    <th>Jenis</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {holidays.length === 0 ? (
                    <tr><td colSpan={4} style={{ textAlign: "center", padding: "32px", color: "var(--color-text-muted)" }}>Belum ada data hari libur</td></tr>
                  ) : holidays.map((h) => (
                    <tr key={h.id}>
                      <td style={{ fontWeight: 500 }}>{h.name}</td>
                      <td>{new Date(h.date.substring(0, 10) + "T00:00:00").toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</td>
                      <td>
                        <span style={{ padding: "2px 8px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: 600, background: h.type === "national" ? "var(--color-primary-50)" : "var(--color-warning-bg)", color: h.type === "national" ? "var(--color-primary)" : "var(--color-warning)" }}>
                          {h.type === "national" ? "Nasional" : "Perusahaan"}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteHoliday(h.id)}>
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Add Holiday Modal */}
      {showHolidayForm && (
        <div className="modal-overlay" onClick={() => setShowHolidayForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Tambah Hari Libur</h3>
              <button onClick={() => setShowHolidayForm(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Nama Hari Libur</label>
                <input className="form-input" value={holidayForm.name} onChange={(e) => setHolidayForm(f => ({ ...f, name: e.target.value }))} placeholder="cth: Hari Raya Idul Fitri" />
              </div>
              <div className="form-group">
                <label className="form-label">Tanggal</label>
                <input className="form-input" type="date" value={holidayForm.date} onChange={(e) => setHolidayForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Jenis</label>
                <select className="form-select" value={holidayForm.type} onChange={(e) => setHolidayForm(f => ({ ...f, type: e.target.value }))}>
                  <option value="national">Nasional</option>
                  <option value="company">Perusahaan</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowHolidayForm(false)}>Batal</button>
              <button className="btn btn-primary" onClick={handleAddHoliday}><Check size={14} /> Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
