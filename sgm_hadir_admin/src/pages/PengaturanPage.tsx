import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { Save, Loader2, Settings, Bell, Building2, FileText, Info } from "lucide-react";
import toast from "react-hot-toast";

interface Setting { key: string; value: string; label: string; group: string; }

type SettingGroup = "general" | "attendance" | "notification" | "report";

const GROUP_META: Record<SettingGroup, { label: string; icon: React.ReactElement; desc: string }> = {
  general:      { label: "Umum", icon: <Building2 size={18} />, desc: "Informasi perusahaan dan identitas sistem" },
  attendance:   { label: "Kehadiran", icon: <Settings size={18} />, desc: "Aturan jam kerja, toleransi, dan geofence" },
  notification: { label: "Notifikasi", icon: <Bell size={18} />, desc: "Jadwal reminder & notifikasi realtime untuk admin dan karyawan" },
  report:       { label: "Laporan", icon: <FileText size={18} />, desc: "Header dan footer untuk file Excel & PDF" },
};

const BOOLEAN_KEYS = new Set(["geofence_strict_mode", "require_selfie", "checkin_reminder_enabled", "checkout_reminder_enabled", "admin_checkin_notif_enabled", "admin_request_notif_enabled"]);
const TIME_KEYS = new Set(["work_start_default", "work_end_default", "checkin_reminder_time", "checkout_reminder_time"]);

export default function PengaturanPage() {
  const [activeGroup, setActiveGroup] = useState<SettingGroup>("general");
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [groupSettings, setGroupSettings] = useState<Setting[]>([]);

  useEffect(() => {
    const ctrl = new AbortController();
    api.get("/admin/settings", { signal: ctrl.signal }).then(res => {
      const all: Setting[] = res.data.data || [];
      const map: Record<string, string> = {};
      all.forEach(s => { map[s.key] = s.value; });
      setSettings(map);
    }).catch(() => toast.error("Gagal memuat pengaturan")).finally(() => setLoading(false));
    return () => ctrl.abort();
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    api.get(`/admin/settings/group/${activeGroup}`, { signal: ctrl.signal }).then(res => {
      setGroupSettings(res.data.data || []);
    }).catch(() => {});
    return () => ctrl.abort();
  }, [activeGroup]);

  const handleChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Only save keys in the current group
      const toSave: Record<string, string> = {};
      groupSettings.forEach(s => { toSave[s.key] = settings[s.key] ?? ""; });
      await api.put("/admin/settings", toSave);
      toast.success("Pengaturan berhasil disimpan");
    } catch {
      toast.error("Gagal menyimpan pengaturan");
    } finally {
      setSaving(false);
    }
  };

  const renderInput = (s: Setting) => {
    const value = settings[s.key] ?? "";
    if (BOOLEAN_KEYS.has(s.key)) {
      return (
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
            <div onClick={() => handleChange(s.key, value === "true" ? "false" : "true")}
              style={{ width: 44, height: 24, borderRadius: 12, background: value === "true" ? "var(--color-primary)" : "var(--color-gray-200)",
                position: "relative", cursor: "pointer", transition: "background 0.2s" }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: "white", position: "absolute",
                top: 2, left: value === "true" ? 22 : 2, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
            </div>
            <span style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>{value === "true" ? "Aktif" : "Nonaktif"}</span>
          </label>
        </div>
      );
    }
    if (TIME_KEYS.has(s.key)) {
      return <input type="time" className="form-input" value={value} onChange={e => handleChange(s.key, e.target.value)} style={{ maxWidth: 160 }} />;
    }
    if (s.key === "late_tolerance_minutes") {
      return (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <input type="number" className="form-input" value={value} min={0} max={120}
            onChange={e => handleChange(s.key, e.target.value)} style={{ maxWidth: 100 }} />
          <span style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>menit</span>
        </div>
      );
    }
    if (s.key === "report_footer_note") {
      return <textarea className="form-input" rows={2} value={value} onChange={e => handleChange(s.key, e.target.value)} style={{ resize: "vertical" }} />;
    }
    return <input type="text" className="form-input" value={value} onChange={e => handleChange(s.key, e.target.value)} />;
  };

  if (loading) return (
    <div className="page-container" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
      <Loader2 size={28} className="animate-spin" style={{ color: "var(--color-primary)" }} />
    </div>
  );

  const meta = GROUP_META[activeGroup];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">⚙️ Pengaturan Sistem</h1>
        <p className="page-subtitle">Konfigurasi aplikasi SGM Hadir</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: "20px" }}>
        {/* Sidebar nav */}
        <div className="card" style={{ padding: 0, height: "fit-content" }}>
          {(Object.keys(GROUP_META) as SettingGroup[]).map(g => {
            const m = GROUP_META[g];
            const isActive = g === activeGroup;
            return (
              <button key={g} onClick={() => setActiveGroup(g)}
                style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "14px 16px",
                  border: "none", background: isActive ? "var(--color-primary-50)" : "transparent",
                  color: isActive ? "var(--color-primary)" : "var(--color-text-secondary)",
                  fontWeight: isActive ? 600 : 400, cursor: "pointer", fontSize: "0.875rem",
                  borderLeft: isActive ? "3px solid var(--color-primary)" : "3px solid transparent",
                  textAlign: "left", transition: "all 0.15s" }}>
                {m.icon} {m.label}
              </button>
            );
          })}
        </div>

        {/* Settings form */}
        <div className="card">
          <div className="card-header" style={{ borderBottom: "1px solid var(--color-border)", paddingBottom: "16px", marginBottom: "20px" }}>
            <div>
              <h3 className="card-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {meta.icon} {meta.label}
              </h3>
              <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", marginTop: "4px" }}>{meta.desc}</p>
            </div>
          </div>
          <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {groupSettings.length === 0 ? (
              <div style={{ padding: "20px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
                Tidak ada pengaturan di grup ini
              </div>
            ) : groupSettings.map(s => (
              <div key={s.key} style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "16px", alignItems: "start" }}>
                <div>
                  <label style={{ fontWeight: 500, fontSize: "0.875rem", color: "var(--color-text-primary)", display: "block" }}>{s.label}</label>
                  <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontFamily: "monospace" }}>{s.key}</span>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  {renderInput(s)}
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "16px", marginTop: "16px", display: "flex", justifyContent: "flex-end" }}>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Simpan Perubahan
            </button>
          </div>
        </div>
      </div>

      {/* Info card */}
      <div className="card" style={{ marginTop: "16px", background: "var(--color-primary-50)", border: "1px solid var(--color-primary-100)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px" }}>
          <Info size={18} style={{ color: "var(--color-primary)", flexShrink: 0 }} />
          <p style={{ fontSize: "0.8rem", color: "var(--color-primary)", margin: 0 }}>
            Beberapa pengaturan seperti jam kerja default hanya berlaku jika cabang tidak memiliki jam kerja spesifik sendiri.
            Perubahan pengaturan notifikasi akan aktif mulai hari berikutnya.
          </p>
        </div>
      </div>
    </div>
  );
}
