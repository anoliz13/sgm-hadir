import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { Save, Loader2, Shield, CheckCircle2, XCircle, Info } from "lucide-react";
import toast from "react-hot-toast";

interface RolePermission {
  id: number;
  role_name: string;
  display_name: string;
  permissions: string[];
}

interface PermGroup {
  group: string;
  label: string;
  items: { key: string; label: string; desc: string }[];
}

const PERM_GROUPS: PermGroup[] = [
  {
    group: "dashboard", label: "Dashboard",
    items: [
      { key: "dashboard.view", label: "Lihat Dashboard", desc: "Akses halaman dashboard utama, statistik, dan grafik" },
    ],
  },
  {
    group: "attendance", label: "Kehadiran",
    items: [
      { key: "attendance.view", label: "Lihat Absensi", desc: "Lihat log check-in/out semua karyawan" },
      { key: "attendance.export", label: "Export Absensi", desc: "Unduh data absensi ke Excel" },
    ],
  },
  {
    group: "reports", label: "Laporan",
    items: [
      { key: "reports.view", label: "Lihat Laporan", desc: "Akses halaman rekap kehadiran, izin, dan lembur" },
      { key: "reports.export", label: "Export Laporan Excel", desc: "Unduh laporan rekap dalam format Excel" },
    ],
  },
  {
    group: "leave", label: "Izin & Cuti",
    items: [
      { key: "leave.view", label: "Lihat Pengajuan Izin", desc: "Lihat semua pengajuan izin dan cuti karyawan" },
      { key: "leave.approve", label: "Approve/Tolak Izin", desc: "Menyetujui atau menolak pengajuan izin karyawan" },
    ],
  },
  {
    group: "overtime", label: "Lembur",
    items: [
      { key: "overtime.view", label: "Lihat Pengajuan Lembur", desc: "Lihat semua pengajuan lembur karyawan" },
      { key: "overtime.approve", label: "Approve/Tolak Lembur", desc: "Menyetujui atau menolak pengajuan lembur" },
    ],
  },
  {
    group: "employees", label: "Karyawan",
    items: [
      { key: "employees.view", label: "Lihat Data Karyawan", desc: "Akses daftar dan profil karyawan" },
      { key: "employees.manage", label: "Kelola Karyawan", desc: "Tambah, edit, dan nonaktifkan akun karyawan" },
    ],
  },
  {
    group: "branches", label: "Cabang",
    items: [
      { key: "branches.view", label: "Lihat Data Cabang", desc: "Akses daftar cabang dan detailnya" },
      { key: "branches.manage", label: "Kelola Cabang", desc: "Tambah dan edit data cabang" },
    ],
  },
  {
    group: "shifts", label: "Shift & Libur",
    items: [
      { key: "shifts.manage", label: "Kelola Shift Kerja", desc: "Buat shift dan assign ke karyawan" },
      { key: "holidays.import", label: "Import Hari Libur", desc: "Tambah dan import kalender hari libur nasional" },
    ],
  },
  {
    group: "visits", label: "Kunjungan",
    items: [
      { key: "visits.view", label: "Lihat Kunjungan Marketing", desc: "Akses log kunjungan marketing" },
    ],
  },
  {
    group: "admin", label: "Administrasi",
    items: [
      { key: "settings.manage", label: "Kelola Pengaturan Sistem", desc: "Ubah konfigurasi aplikasi SGM Hadir" },
      { key: "roles.manage", label: "Kelola Role & Permission", desc: "Atur hak akses setiap peran pengguna" },
    ],
  },
];

const ROLE_INFO: Record<string, { color: string; bg: string }> = {
  super_admin:   { color: "#5B21B6", bg: "#EDE9FE" },
  supervisor:    { color: "#1E3A8A", bg: "#DBEAFE" },
  kepala_salut:  { color: "#065F46", bg: "#D1FAE5" },
  manajer_salut: { color: "#92400E", bg: "#FEF3C7" },
  employee:      { color: "#374151", bg: "#F3F4F6" },
};

export default function RoleManagementPage() {
  const [roles, setRoles] = useState<RolePermission[]>([]);
  const [selected, setSelected] = useState<RolePermission | null>(null);
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    api.get("/admin/role-permissions").then(res => {
      const list: RolePermission[] = res.data.data || [];
      setRoles(list);
      if (list.length > 0) selectRole(list[0]);
    }).catch(() => toast.error("Gagal memuat data role"))
      .finally(() => setLoading(false));
  }, []);

  const selectRole = (role: RolePermission) => {
    setSelected(role);
    setPermissions(new Set(role.permissions || []));
    setDirty(false);
  };

  const toggle = (key: string) => {
    if (selected?.role_name === "super_admin") return; // super_admin always has all
    setPermissions(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
    setDirty(true);
  };

  const toggleGroup = (groupKeys: string[]) => {
    if (selected?.role_name === "super_admin") return;
    const allActive = groupKeys.every(k => permissions.has(k));
    setPermissions(prev => {
      const next = new Set(prev);
      groupKeys.forEach(k => allActive ? next.delete(k) : next.add(k));
      return next;
    });
    setDirty(true);
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await api.put(`/admin/role-permissions/${selected.role_name}`, {
        display_name: selected.display_name,
        permissions: Array.from(permissions),
      });
      // Update local state
      setRoles(prev => prev.map(r => r.role_name === selected.role_name
        ? { ...r, permissions: Array.from(permissions) } : r));
      setDirty(false);
      toast.success(`Permission untuk "${selected.display_name}" berhasil disimpan`);
    } catch {
      toast.error("Gagal menyimpan permission");
    } finally {
      setSaving(false);
    }
  };

  const allPermKeys = PERM_GROUPS.flatMap(g => g.items.map(i => i.key));

  if (loading) return (
    <div className="page-container" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
      <Loader2 size={28} className="animate-spin" style={{ color: "var(--color-primary)" }} />
    </div>
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">🛡️ Manajemen Role & Permission</h1>
        <p className="page-subtitle">Atur hak akses setiap peran pengguna secara granular</p>
      </div>

      {/* Info */}
      <div style={{ background: "var(--color-primary-50)", border: "1px solid var(--color-primary-100)", borderRadius: 8, padding: "12px 16px", marginBottom: 16, display: "flex", gap: 10, alignItems: "flex-start" }}>
        <Info size={16} style={{ color: "var(--color-primary)", marginTop: 2, flexShrink: 0 }} />
        <p style={{ fontSize: "0.8rem", color: "var(--color-primary)", margin: 0 }}>
          Permission yang diatur di sini mengontrol akses menu dan fitur di Admin Dashboard.
          Role <strong>Super Admin</strong> selalu memiliki semua akses dan tidak dapat diubah.
          Perubahan berlaku saat pengguna login kembali.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: "20px" }}>
        {/* Role list */}
        <div className="card" style={{ padding: 0, height: "fit-content" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--color-border)", fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
            Pilih Role
          </div>
          {roles.length === 0 ? (
            <div style={{ padding: "24px 16px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
              Belum ada data role
            </div>
          ) : roles.map(role => {
            const info = ROLE_INFO[role.role_name] || { color: "#374151", bg: "#F3F4F6" };
            const isActive = selected?.role_name === role.role_name;
            const permCount = (role.permissions || []).length;
            return (
              <button key={role.role_name} onClick={() => selectRole(role)}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%",
                  padding: "14px 16px", border: "none", background: isActive ? info.bg : "transparent",
                  cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                  borderLeft: isActive ? `3px solid ${info.color}` : "3px solid transparent" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.875rem", color: info.color }}>{role.display_name}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{role.role_name}</div>
                </div>
                <span style={{ background: info.bg, color: info.color, padding: "2px 8px", borderRadius: 12, fontSize: "0.7rem", fontWeight: 700, border: `1px solid ${info.color}20` }}>
                  {permCount}/{allPermKeys.length}
                </span>
              </button>
            );
          })}
        </div>

        {/* Permission matrix */}
        {selected && (
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Shield size={18} style={{ color: ROLE_INFO[selected.role_name]?.color }} />
                  {selected.display_name}
                </h3>
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", marginTop: 4 }}>
                  {permissions.size} dari {allPermKeys.length} permission aktif
                </p>
              </div>
              {dirty && selected.role_name !== "super_admin" && (
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Simpan
                </button>
              )}
            </div>

            <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "0" }}>
              {selected.role_name === "super_admin" && (
                <div style={{ background: "#EDE9FE", border: "1px solid #C4B5FD", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: "0.8rem", color: "#5B21B6" }}>
                  ⚠️ Super Admin memiliki semua permission dan tidak dapat diubah.
                </div>
              )}

              {PERM_GROUPS.map(pg => {
                const groupKeys = pg.items.map(i => i.key);
                const activeCount = groupKeys.filter(k => permissions.has(k)).length;
                const allActive = activeCount === groupKeys.length;
                const partialActive = activeCount > 0 && !allActive;
                return (
                  <div key={pg.group} style={{ borderBottom: "1px solid var(--color-border)", paddingBottom: 16, marginBottom: 16 }}>
                    {/* Group header */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-secondary)" }}>
                          {pg.label}
                        </span>
                        <span style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>({activeCount}/{groupKeys.length})</span>
                      </div>
                      {selected.role_name !== "super_admin" && (
                        <button onClick={() => toggleGroup(groupKeys)}
                          style={{ fontSize: "0.75rem", color: "var(--color-primary)", border: "none", background: "none", cursor: "pointer", padding: "2px 8px", borderRadius: 4, fontWeight: 500 }}>
                          {allActive ? "Nonaktifkan Semua" : partialActive ? "Aktifkan Semua" : "Aktifkan Semua"}
                        </button>
                      )}
                    </div>
                    {/* Permission items */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                      {pg.items.map(item => {
                        const active = selected.role_name === "super_admin" || permissions.has(item.key);
                        return (
                          <div key={item.key}
                            onClick={() => toggle(item.key)}
                            style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "10px 12px",
                              borderRadius: 8, border: `1px solid ${active ? "var(--color-primary)" : "var(--color-border)"}`,
                              background: active ? "var(--color-primary-50)" : "transparent",
                              cursor: selected.role_name === "super_admin" ? "default" : "pointer",
                              transition: "all 0.15s", userSelect: "none" }}>
                            {active
                              ? <CheckCircle2 size={18} style={{ color: "var(--color-primary)", flexShrink: 0, marginTop: 1 }} />
                              : <XCircle size={18} style={{ color: "var(--color-text-muted)", flexShrink: 0, marginTop: 1 }} />}
                            <div>
                              <div style={{ fontWeight: 600, fontSize: "0.8rem", color: active ? "var(--color-primary)" : "var(--color-text-primary)" }}>{item.label}</div>
                              <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", marginTop: 2 }}>{item.desc}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {dirty && selected.role_name !== "super_admin" && (
              <div style={{ borderTop: "1px solid var(--color-border)", padding: "16px", display: "flex", justifyContent: "flex-end", background: "var(--color-warning-bg)", borderRadius: "0 0 8px 8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "0.875rem", color: "var(--color-warning)", fontWeight: 500 }}>Ada perubahan yang belum disimpan</span>
                  <button className="btn btn-secondary btn-sm" onClick={() => { if (selected) { setPermissions(new Set(selected.permissions)); setDirty(false); } }}>Batal</button>
                  <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Simpan Permission
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
