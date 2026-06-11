import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";
import { FileSpreadsheet, Search, Download, Loader2, Filter, Calendar, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";

type ReportTab = "rekap" | "izin" | "lembur";

interface Branch { id: string; name: string; }

const STATUS_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  approved: { bg: "#D1FAE5", color: "#065F46", label: "Disetujui" },
  rejected: { bg: "#FEE2E2", color: "#991B1B", label: "Ditolak" },
  pending:  { bg: "#FEF3C7", color: "#92400E", label: "Menunggu" },
};

const QUICK_RANGES = [
  { label: "Bulan Ini", getDates: () => {
    const now = new Date();
    const s = new Date(now.getFullYear(), now.getMonth(), 1);
    const e = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return [s, e];
  }},
  { label: "Bulan Lalu", getDates: () => {
    const now = new Date();
    const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const e = new Date(now.getFullYear(), now.getMonth(), 0);
    return [s, e];
  }},
  { label: "3 Bulan", getDates: () => {
    const now = new Date();
    const s = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    return [s, now];
  }},
  { label: "Tahun Ini", getDates: () => {
    const now = new Date();
    const s = new Date(now.getFullYear(), 0, 1);
    return [s, now];
  }},
];

const fmt = (d: Date) => d.toLocaleDateString("sv-SE");
const fmtDisplay = (s: string) => s ? new Date(s + "T00:00:00").toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" }) : "-";
const statusBadge = (status: string) => {
  const s = STATUS_BADGE[status] || { bg: "#F3F4F6", color: "#374151", label: status };
  return <span style={{ padding: "2px 8px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: 600, background: s.bg, color: s.color }}>{s.label}</span>;
};

export default function LaporanPage() {
  const [tab, setTab] = useState<ReportTab>("rekap");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [startDate, setStartDate] = useState(() => fmt(new Date(new Date().getFullYear(), new Date().getMonth(), 1)));
  const [endDate, setEndDate] = useState(() => fmt(new Date()));
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [showQuick, setShowQuick] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    api.get("/admin/branches", { signal: ctrl.signal }).then(r => setBranches(r.data.data || [])).catch(() => {});
    return () => ctrl.abort();
  }, []);

  const endpoint: Record<ReportTab, string> = {
    rekap: "/admin/reports/attendance",
    izin: "/admin/reports/leaves",
    lembur: "/admin/reports/overtime",
  };

  const handleLoad = useCallback(async () => {
    setLoading(true);
    setData([]);
    try {
      const params = new URLSearchParams({ start_date: startDate, end_date: endDate });
      if (selectedBranch !== "all") params.append("branch_id", selectedBranch);
      if (search && tab === "rekap") params.append("search", search);
      const res = await api.get(`${endpoint[tab]}?${params}`);
      setData(res.data.data || []);
      toast.success(`${(res.data.data || []).length} data dimuat`);
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Gagal memuat laporan");
    } finally {
      setLoading(false);
    }
  }, [tab, startDate, endDate, selectedBranch, search]);

  const handleExportExcel = async () => {
    if (tab !== "rekap") { toast("Export Excel hanya untuk Rekap Kehadiran"); return; }
    setExporting(true);
    try {
      const params = new URLSearchParams({ start_date: startDate, end_date: endDate });
      if (selectedBranch !== "all") params.append("branch_id", selectedBranch);
      const res = await api.get(`/admin/reports/export/excel?${params}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `Rekap_Kehadiran_${startDate}_sd_${endDate}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("File Excel berhasil diunduh");
    } catch {
      toast.error("Gagal mengunduh Excel");
    } finally {
      setExporting(false);
    }
  };

  const applyQuick = (idx: number) => {
    const [s, e] = QUICK_RANGES[idx].getDates();
    setStartDate(fmt(s));
    setEndDate(fmt(e));
    setShowQuick(false);
  };

  const tabs: { key: ReportTab; label: string; icon: string }[] = [
    { key: "rekap", label: "Rekap Kehadiran", icon: "📋" },
    { key: "izin", label: "Izin & Cuti", icon: "🏖️" },
    { key: "lembur", label: "Lembur", icon: "🌙" },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">📊 Laporan</h1>
        <p className="page-subtitle">Unduh dan analisa laporan kehadiran, izin, dan lembur karyawan</p>
      </div>

      {/* Tab selector */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", borderBottom: "2px solid var(--color-border)", paddingBottom: "0" }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setData([]); }}
            style={{ padding: "10px 20px", border: "none", background: "none", cursor: "pointer", fontWeight: 600, fontSize: "0.875rem",
              borderBottom: tab === t.key ? "2px solid var(--color-primary)" : "2px solid transparent",
              color: tab === t.key ? "var(--color-primary)" : "var(--color-text-secondary)",
              marginBottom: "-2px", transition: "all 0.15s" }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Filter Card */}
      <div className="card" style={{ marginBottom: "16px" }}>
        <div className="card-body">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto auto 1fr", gap: "12px", alignItems: "end" }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label"><Calendar size={13} style={{ marginRight: 4 }} />Tanggal Mulai</label>
              <input type="date" className="form-input" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label"><Calendar size={13} style={{ marginRight: 4 }} />Tanggal Selesai</label>
              <input type="date" className="form-input" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0, position: "relative" }}>
              <label className="form-label">Periode Cepat</label>
              <button className="btn btn-secondary" style={{ width: "100%" }} onClick={() => setShowQuick(v => !v)}>
                Pilih <ChevronDown size={14} />
              </button>
              {showQuick && (
                <div style={{ position: "absolute", top: "100%", left: 0, zIndex: 100, background: "white", border: "1px solid var(--color-border)", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", minWidth: "140px" }}>
                  {QUICK_RANGES.map((r, i) => (
                    <button key={i} onClick={() => applyQuick(i)}
                      style={{ display: "block", width: "100%", padding: "10px 16px", border: "none", background: "none", cursor: "pointer", textAlign: "left", fontSize: "0.875rem" }}>
                      {r.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Cabang</label>
              <select className="form-select" value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)}>
                <option value="all">Semua Cabang</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            {tab === "rekap" && (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Cari Karyawan</label>
                <div style={{ position: "relative" }}>
                  <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
                  <input className="form-input" style={{ paddingLeft: 30 }} placeholder="Nama atau NIK..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: "8px", marginTop: "12px", justifyContent: "flex-end" }}>
            {tab === "rekap" && (
              <button className="btn btn-success" onClick={handleExportExcel} disabled={exporting || data.length === 0}>
                {exporting ? <Loader2 size={15} className="animate-spin" /> : <FileSpreadsheet size={15} />}
                Export Excel
              </button>
            )}
            <button className="btn btn-primary" onClick={handleLoad} disabled={loading}>
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
              Tampilkan Laporan
            </button>
          </div>
        </div>
      </div>

      {/* Period summary bar */}
      {data.length > 0 && (
        <div style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", marginBottom: "8px" }}>
          <Filter size={13} style={{ marginRight: 4 }} />
          <strong>{data.length}</strong> data &bull; Periode: <strong>{fmtDisplay(startDate)}</strong> s/d <strong>{fmtDisplay(endDate)}</strong>
          {selectedBranch !== "all" && <> &bull; Cabang: <strong>{branches.find(b => b.id === selectedBranch)?.name}</strong></>}
        </div>
      )}

      {/* Table */}
      {data.length > 0 ? (
        <div className="card">
          <div className="data-table-container">
            {tab === "rekap" && <RekapTable data={data} />}
            {tab === "izin" && <IzinTable data={data} statusBadge={statusBadge} />}
            {tab === "lembur" && <LemburTable data={data} statusBadge={statusBadge} />}
          </div>
        </div>
      ) : !loading ? (
        <div className="card">
          <div className="empty-state" style={{ padding: "60px 24px" }}>
            <FileSpreadsheet size={40} style={{ color: "var(--color-primary)", marginBottom: 12 }} />
            <p className="empty-state-title">Pilih Periode & Klik Tampilkan Laporan</p>
            <p className="empty-state-desc">Atur filter di atas lalu klik "Tampilkan Laporan" untuk memuat data.</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function RekapTable({ data }: { data: any[] }) {
  const totals = data.reduce((acc, r) => ({
    hadir: acc.hadir + (r.total_hadir ?? 0),
    terlambat: acc.terlambat + (r.total_terlambat ?? 0),
    sakit: acc.sakit + (r.sakit ?? 0),
    cuti: acc.cuti + (r.cuti ?? 0),
    alpha: acc.alpha + (r.alpha ?? 0),
    lembur: acc.lembur + (r.jam_lembur ?? 0),
  }), { hadir: 0, terlambat: 0, sakit: 0, cuti: 0, alpha: 0, lembur: 0 });

  const avgPct = data.length ? data.reduce((s, r) => s + (r.persentase_hadir ?? 0), 0) / data.length : 0;

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>No</th><th>NIK</th><th>Nama</th><th>Divisi</th><th>Cabang</th><th>Shift</th>
          <th style={{ textAlign: "center" }}>Hadir</th>
          <th style={{ textAlign: "center" }}>Telat</th>
          <th style={{ textAlign: "center" }}>Sakit</th>
          <th style={{ textAlign: "center" }}>Cuti</th>
          <th style={{ textAlign: "center" }}>Alpha</th>
          <th style={{ textAlign: "center" }}>Lembur (Jam)</th>
          <th style={{ textAlign: "center" }}>Hari Efektif</th>
          <th style={{ textAlign: "center" }}>% Hadir</th>
        </tr>
      </thead>
      <tbody>
        {data.map((r, i) => (
          <tr key={r.user_id || i}>
            <td style={{ color: "var(--color-text-muted)" }}>{i + 1}</td>
            <td><span style={{ fontFamily: "monospace", fontWeight: 600, color: "var(--color-primary)" }}>{r.nik}</span></td>
            <td style={{ fontWeight: 500 }}>{r.name}</td>
            <td style={{ color: "var(--color-text-secondary)" }}>{r.division || "-"}</td>
            <td style={{ color: "var(--color-text-secondary)" }}>{r.branch_name || "-"}</td>
            <td><span style={{ fontSize: "0.78rem", padding: "2px 8px", borderRadius: "12px", background: r.shift_name && r.shift_name !== "-" ? "var(--color-primary-50)" : "var(--color-gray-100)", color: r.shift_name && r.shift_name !== "-" ? "var(--color-primary)" : "var(--color-text-muted)", fontWeight: 500 }}>{r.shift_name || "-"}</span></td>
            <td style={{ textAlign: "center", color: "var(--color-success)", fontWeight: 600 }}>{r.total_hadir ?? 0}</td>
            <td style={{ textAlign: "center", color: (r.total_terlambat ?? 0) > 0 ? "var(--color-warning)" : undefined }}>{r.total_terlambat ?? 0}</td>
            <td style={{ textAlign: "center" }}>{r.sakit ?? 0}</td>
            <td style={{ textAlign: "center" }}>{r.cuti ?? 0}</td>
            <td style={{ textAlign: "center", color: (r.alpha ?? 0) > 0 ? "var(--color-danger)" : undefined, fontWeight: (r.alpha ?? 0) > 0 ? 700 : undefined }}>{r.alpha ?? 0}</td>
            <td style={{ textAlign: "center", color: "#8B5CF6" }}>{(r.jam_lembur ?? 0).toFixed(1)}</td>
            <td style={{ textAlign: "center" }}>{r.hari_kerja_efektif ?? 0}</td>
            <td style={{ textAlign: "center" }}>
              <span className={`badge ${(r.persentase_hadir ?? 0) >= 90 ? "success" : (r.persentase_hadir ?? 0) >= 75 ? "warning" : "danger"}`}>
                {(r.persentase_hadir ?? 0).toFixed(1)}%
              </span>
            </td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr style={{ fontWeight: 700, background: "var(--color-primary-50)" }}>
          <td></td><td></td>
          <td>TOTAL ({data.length} karyawan)</td>
          <td></td><td></td><td></td>
          <td style={{ textAlign: "center" }}>{totals.hadir}</td>
          <td style={{ textAlign: "center" }}>{totals.terlambat}</td>
          <td style={{ textAlign: "center" }}>{totals.sakit}</td>
          <td style={{ textAlign: "center" }}>{totals.cuti}</td>
          <td style={{ textAlign: "center" }}>{totals.alpha}</td>
          <td style={{ textAlign: "center" }}>{totals.lembur.toFixed(1)}</td>
          <td></td>
          <td style={{ textAlign: "center" }}>{avgPct.toFixed(1)}%</td>
        </tr>
      </tfoot>
    </table>
  );
}

function IzinTable({ data, statusBadge }: { data: any[]; statusBadge: (s: string) => React.ReactElement }) {
  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>No</th><th>NIK</th><th>Nama</th><th>Cabang</th>
          <th>Jenis Izin</th><th>Tanggal Mulai</th><th>Tanggal Selesai</th>
          <th style={{ textAlign: "center" }}>Durasi (Hari)</th>
          <th>Alasan</th><th>Status</th>
        </tr>
      </thead>
      <tbody>
        {data.map((r, i) => (
          <tr key={i}>
            <td style={{ color: "var(--color-text-muted)" }}>{i + 1}</td>
            <td><span style={{ fontFamily: "monospace", fontWeight: 600, color: "var(--color-primary)" }}>{r.nik}</span></td>
            <td style={{ fontWeight: 500 }}>{r.name}</td>
            <td style={{ color: "var(--color-text-secondary)" }}>{r.branch_name}</td>
            <td>{r.leave_type}</td>
            <td>{fmtDisplay(r.start_date)}</td>
            <td>{fmtDisplay(r.end_date)}</td>
            <td style={{ textAlign: "center", fontWeight: 600 }}>{r.total_days}</td>
            <td style={{ color: "var(--color-text-secondary)", maxWidth: 200 }}>{r.reason || "-"}</td>
            <td>{statusBadge(r.status)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function LemburTable({ data, statusBadge }: { data: any[]; statusBadge: (s: string) => React.ReactElement }) {
  const totEst = data.reduce((s, r) => s + (r.est_hours ?? 0), 0);
  const totAct = data.reduce((s, r) => s + (r.actual_hours ?? 0), 0);
  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>No</th><th>NIK</th><th>Nama</th><th>Cabang</th>
          <th>Tanggal Lembur</th>
          <th style={{ textAlign: "center" }}>Est. Jam</th>
          <th style={{ textAlign: "center" }}>Aktual Jam</th>
          <th>Keterangan</th><th>Status</th>
        </tr>
      </thead>
      <tbody>
        {data.map((r, i) => (
          <tr key={i}>
            <td style={{ color: "var(--color-text-muted)" }}>{i + 1}</td>
            <td><span style={{ fontFamily: "monospace", fontWeight: 600, color: "var(--color-primary)" }}>{r.nik}</span></td>
            <td style={{ fontWeight: 500 }}>{r.name}</td>
            <td style={{ color: "var(--color-text-secondary)" }}>{r.branch_name}</td>
            <td>{fmtDisplay(r.date)}</td>
            <td style={{ textAlign: "center" }}>{(r.est_hours ?? 0).toFixed(1)}</td>
            <td style={{ textAlign: "center", fontWeight: 600, color: "#8B5CF6" }}>{(r.actual_hours ?? 0).toFixed(1)}</td>
            <td style={{ color: "var(--color-text-secondary)" }}>{r.reason || "-"}</td>
            <td>{statusBadge(r.status)}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr style={{ fontWeight: 700, background: "var(--color-primary-50)" }}>
          <td></td><td></td>
          <td>TOTAL ({data.length} record)</td>
          <td></td><td></td>
          <td style={{ textAlign: "center" }}>{totEst.toFixed(1)}</td>
          <td style={{ textAlign: "center" }}>{totAct.toFixed(1)}</td>
          <td></td><td></td>
        </tr>
      </tfoot>
    </table>
  );
}
