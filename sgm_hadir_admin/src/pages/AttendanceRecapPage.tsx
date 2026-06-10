/**
 * Attendance Recap Page - FITUR UTAMA ⭐
 * Rekap kehadiran karyawan dengan filter periode kustom untuk penggajian
 */

import React, { useState, useEffect } from "react";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import StatusBadge from "../components/ui/StatusBadge";
import type { Branch, RecapRow, RecapSummary } from "../lib/types";
import {
  Download,
  FileSpreadsheet,
  FileText,
  Search,
  Loader2,
  Save,
  Calendar,
  Filter,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";

export default function AttendanceRecapPage() {
  const { userData } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Filters
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(16);
    d.setMonth(d.getMonth() - 1);
    return d.toLocaleDateString("sv-SE");
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(15);
    return d.toLocaleDateString("sv-SE");
  });
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [selectedDivision, setSelectedDivision] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Data
  const [recapData, setRecapData] = useState<RecapRow[]>([]);
  const [summary, setSummary] = useState<RecapSummary | null>(null);
  const [totalWorkingDays, setTotalWorkingDays] = useState(0);

  // Sort
  const [sortField, setSortField] = useState<keyof RecapRow>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Load branches
  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/admin/branches');
        const branchesData = res.data.data || [];
        setBranches(branchesData.map((b: any) => ({
          id: b.id,
          name: b.name,
        })));
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, []);

  // Get unique divisions from recap data
  const divisions = [...new Set(recapData.map((r) => r.division))].filter(Boolean);

  // Generate recap
  const handleGenerateRecap = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
      });
      if (selectedBranch !== "all") params.append("branch_id", selectedBranch);
      if (searchQuery) params.append("search", searchQuery);

      const res = await api.get(`/admin/reports/attendance?${params.toString()}`);
      const rawData: any[] = res.data.data || [];

      // Map backend AttendanceSummary fields to RecapRow
      const mapped: RecapRow[] = rawData.map((d: any) => ({
        userId: d.user_id,
        nik: d.nik,
        name: d.name,
        division: d.division,
        branchName: d.branch_name,
        shiftName: d.shift_name || "-",
        totalPresent: d.total_hadir ?? 0,
        totalLate: d.total_terlambat ?? 0,
        totalLateMinutes: 0,
        totalSick: d.sakit ?? 0,
        totalAnnualLeave: d.cuti ?? 0,
        totalOtherLeave: 0,
        totalAlpha: d.alpha ?? 0,
        totalOvertimeHours: d.jam_lembur ?? 0,
        effectiveWorkDays: d.hari_kerja_efektif ?? 0,
        attendancePercentage: d.persentase_hadir ?? 0,
      }));

      setRecapData(mapped);
      setTotalWorkingDays(mapped[0]?.effectiveWorkDays || 0);

      const avg = mapped.length > 0
        ? mapped.reduce((s, r) => s + r.attendancePercentage, 0) / mapped.length
        : 0;
      setSummary({
        totalEmployees: mapped.length,
        avgPresent: mapped.reduce((s, r) => s + r.totalPresent, 0) / (mapped.length || 1),
        avgLate: mapped.reduce((s, r) => s + r.totalLate, 0) / (mapped.length || 1),
        avgAttendancePercentage: avg,
      });

      toast.success(`Rekap berhasil dimuat: ${mapped.length} karyawan`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal memuat rekap kehadiran");
    } finally {
      setLoading(false);
    }
  };

  // Export Excel
  const handleExportExcel = async () => {
    if (recapData.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    setExporting(true);
    try {
      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
      });
      if (selectedBranch !== "all") {
        params.append("branch_id", selectedBranch);
      }

      const res = await api.get(`/admin/reports/export/excel?${params.toString()}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Rekap_Absensi_${startDate}_${endDate}.xlsx`);
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

  // Export PDF
  const handleExportPdf = async () => {
    toast.error("Fitur Export PDF segera hadir!");
  };

  // Sort handler
  const handleSort = (field: keyof RecapRow) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  // Filter and sort data
  const filteredData = recapData
    .filter((row) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          row.name.toLowerCase().includes(q) ||
          row.nik.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .filter((row) => {
      if (selectedDivision !== "all" && row.division !== selectedDivision)
        return false;
      return true;
    })
    .sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === "string") {
        return sortDir === "asc"
          ? (aVal as string).localeCompare(bVal as string)
          : (bVal as string).localeCompare(aVal as string);
      }
      return sortDir === "asc"
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });

  const SortIcon = ({ field }: { field: keyof RecapRow }) => (
    <span className={`sort-indicator ${sortField === field ? "sorted" : ""}`}>
      {sortField === field ? (
        sortDir === "asc" ? (
          <ChevronUp size={12} />
        ) : (
          <ChevronDown size={12} />
        )
      ) : (
        <ChevronUp size={12} style={{ opacity: 0.3 }} />
      )}
    </span>
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">⭐ Rekap Kehadiran</h1>
        <p className="page-subtitle">
          Rekap kehadiran karyawan untuk keperluan penggajian
        </p>
      </div>

      {/* Filter Card */}
      <div className="card" style={{ marginBottom: "20px" }}>
        <div className="card-header">
          <h3 className="card-title">
            <Filter size={16} style={{ marginRight: "8px" }} />
            Filter Periode & Cabang
          </h3>
        </div>
        <div className="card-body">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "16px",
              marginBottom: "16px",
            }}
          >
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">
                <Calendar size={14} style={{ marginRight: "4px" }} />
                Tanggal Mulai
              </label>
              <input
                type="date"
                className="form-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">
                <Calendar size={14} style={{ marginRight: "4px" }} />
                Tanggal Selesai
              </label>
              <input
                type="date"
                className="form-input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Cabang</label>
              <select
                className="form-select"
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
              >
                <option value="all">Semua Cabang</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Divisi</label>
              <select
                className="form-select"
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
              >
                <option value="all">Semua Divisi</option>
                {divisions.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{ position: "relative", flex: 1, maxWidth: "320px" }}
            >
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
                placeholder="Cari nama atau NIK..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <button
              className="btn btn-primary btn-lg"
              onClick={handleGenerateRecap}
              disabled={loading}
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Search size={18} />
              )}
              {loading ? "Memproses..." : "Tampilkan Rekap"}
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {recapData.length > 0 && (
        <>
          {/* Summary Info + Export */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px",
            }}
          >
            <div style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
              📋 <strong>{filteredData.length}</strong> karyawan •{" "}
              <strong>{totalWorkingDays}</strong> hari kerja efektif •{" "}
              Periode: {startDate} s/d {endDate}
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                className="btn btn-success"
                onClick={handleExportExcel}
                disabled={exporting}
              >
                {exporting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <FileSpreadsheet size={16} />
                )}
                Export Excel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleExportPdf}
                disabled={exporting}
              >
                {exporting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <FileText size={16} />
                )}
                Export PDF
              </button>
              <button className="btn btn-outline">
                <Save size={16} />
                Simpan Snapshot
              </button>
            </div>
          </div>

          {/* Recap Table */}
          <div className="card">
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: "40px" }}>No</th>
                    <th
                      onClick={() => handleSort("nik")}
                      className={sortField === "nik" ? "sorted" : ""}
                    >
                      NIK <SortIcon field="nik" />
                    </th>
                    <th
                      onClick={() => handleSort("name")}
                      className={sortField === "name" ? "sorted" : ""}
                    >
                      Nama <SortIcon field="name" />
                    </th>
                    <th>Divisi</th>
                    <th>Cabang</th>
                    <th>Shift</th>
                    <th
                      onClick={() => handleSort("totalPresent")}
                      className={sortField === "totalPresent" ? "sorted" : ""}
                      style={{ textAlign: "center" }}
                    >
                      Hadir <SortIcon field="totalPresent" />
                    </th>
                    <th
                      onClick={() => handleSort("totalLate")}
                      className={sortField === "totalLate" ? "sorted" : ""}
                      style={{ textAlign: "center" }}
                    >
                      Telat <SortIcon field="totalLate" />
                    </th>
                    <th style={{ textAlign: "center" }}>Mnt Telat</th>
                    <th style={{ textAlign: "center" }}>Sakit</th>
                    <th style={{ textAlign: "center" }}>Cuti</th>
                    <th style={{ textAlign: "center" }}>Izin</th>
                    <th
                      onClick={() => handleSort("totalAlpha")}
                      className={sortField === "totalAlpha" ? "sorted" : ""}
                      style={{ textAlign: "center" }}
                    >
                      Alpha <SortIcon field="totalAlpha" />
                    </th>
                    <th style={{ textAlign: "center" }}>Lembur (jam)</th>
                    <th
                      onClick={() => handleSort("attendancePercentage")}
                      className={
                        sortField === "attendancePercentage" ? "sorted" : ""
                      }
                      style={{ textAlign: "center" }}
                    >
                      % Hadir <SortIcon field="attendancePercentage" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((row, index) => (
                    <tr key={row.userId}>
                      <td style={{ textAlign: "center", color: "var(--color-text-secondary)" }}>
                        {index + 1}
                      </td>
                      <td>
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontWeight: 600,
                            color: "var(--color-primary)",
                          }}
                        >
                          {row.nik}
                        </span>
                      </td>
                      <td style={{ fontWeight: 500 }}>{row.name}</td>
                      <td style={{ color: "var(--color-text-secondary)" }}>
                        {row.division || "-"}
                      </td>
                      <td style={{ color: "var(--color-text-secondary)" }}>
                        {row.branchName || "-"}
                      </td>
                      <td>
                        <span style={{ fontSize: "0.78rem", padding: "2px 8px", borderRadius: "12px", background: row.shiftName && row.shiftName !== "-" ? "var(--color-primary-50)" : "var(--color-gray-100)", color: row.shiftName && row.shiftName !== "-" ? "var(--color-primary)" : "var(--color-text-muted)", fontWeight: 500, whiteSpace: "nowrap" }}>
                          {row.shiftName || "-"}
                        </span>
                      </td>
                      <td style={{ textAlign: "center", fontWeight: 600 }}>
                        <span style={{ color: "var(--color-success)" }}>
                          {row.totalPresent}
                        </span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {row.totalLate > 0 ? (
                          <span
                            style={{
                              color: "var(--color-warning)",
                              fontWeight: 600,
                            }}
                          >
                            {row.totalLate}
                          </span>
                        ) : (
                          <span style={{ color: "var(--color-text-muted)" }}>
                            0
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {row.totalLateMinutes > 0 ? (
                          <span style={{ color: "var(--color-warning)" }}>
                            {row.totalLateMinutes}
                          </span>
                        ) : (
                          <span style={{ color: "var(--color-text-muted)" }}>
                            0
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {row.totalSick || 0}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {row.totalAnnualLeave || 0}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {row.totalOtherLeave || 0}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {row.totalAlpha > 0 ? (
                          <span
                            style={{
                              color: "var(--color-danger)",
                              fontWeight: 700,
                            }}
                          >
                            {row.totalAlpha}
                          </span>
                        ) : (
                          <span style={{ color: "var(--color-text-muted)" }}>
                            0
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {row.totalOvertimeHours > 0 ? (
                          <span style={{ color: "#8B5CF6", fontWeight: 500 }}>
                            {row.totalOvertimeHours}
                          </span>
                        ) : (
                          <span style={{ color: "var(--color-text-muted)" }}>
                            0
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span
                          className={`badge ${
                            row.attendancePercentage >= 90
                              ? "success"
                              : row.attendancePercentage >= 75
                              ? "warning"
                              : "danger"
                          }`}
                        >
                          {row.attendancePercentage.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {/* Summary Row */}
                {summary && (
                  <tfoot>
                    <tr
                      style={{
                        background: "var(--color-bg)",
                        fontWeight: 700,
                        borderTop: "2px solid var(--color-border)",
                      }}
                    >
                      <td></td>
                      <td></td>
                      <td>
                        RATA-RATA ({summary.totalEmployees} karyawan)
                      </td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td style={{ textAlign: "center" }}>
                        {summary.avgPresent}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {summary.avgLate}
                      </td>
                      <td colSpan={5}></td>
                      <td></td>
                      <td style={{ textAlign: "center" }}>
                        <span
                          className={`badge ${
                            summary.avgAttendancePercentage >= 90
                              ? "success"
                              : "warning"
                          }`}
                        >
                          {summary.avgAttendancePercentage.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </>
      )}

      {/* Empty state when no data loaded */}
      {recapData.length === 0 && !loading && (
        <div className="card">
          <div className="empty-state" style={{ padding: "80px 24px" }}>
            <div
              style={{
                width: "80px",
                height: "80px",
                margin: "0 auto 20px",
                background: "var(--color-primary-50)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FileSpreadsheet
                size={36}
                style={{ color: "var(--color-primary)" }}
              />
            </div>
            <p className="empty-state-title">Pilih Periode Rekap</p>
            <p className="empty-state-desc">
              Atur tanggal mulai dan selesai di filter atas, lalu klik
              "Tampilkan Rekap" untuk memuat data kehadiran.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
