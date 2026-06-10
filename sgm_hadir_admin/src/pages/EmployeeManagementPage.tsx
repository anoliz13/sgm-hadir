/**
 * Employee Management Page
 */

import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import type { User, Branch } from "../lib/types";
import { ROLE_LABELS } from "../lib/types";
import {
  Users,
  Plus,
  Search,
  Edit,
  Key,
  ToggleLeft,
  ToggleRight,
  Loader2,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

export default function EmployeeManagementPage() {
  const { userData, isSuperAdmin } = useAuth();
  const [employees, setEmployees] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBranch, setFilterBranch] = useState("all");
  const [saving, setSaving] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<User | null>(null);

  // Form state
  const [form, setForm] = useState({
    nik: "",
    name: "",
    email: "",
    phone: "",
    password: "",
    position: "",
    division: "",
    branchId: "",
    role: "KARYAWAN" as string,
    annualLeaveQuota: 7,
  });

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [empRes, branchRes] = await Promise.all([
        api.get('/admin/employees'),
        api.get('/admin/branches'),
      ]);

      const empsData = empRes.data.data || [];
      const mappedEmps = empsData.map((e: any) => ({
        id: e.id,
        nik: e.nik,
        name: e.name,
        email: e.email,
        phone: e.phone,
        position: e.position,
        division: e.division,
        branchId: e.branch_id,
        role: e.role,
        isActive: e.is_active,
        joinDate: e.created_at, // Use created_at as join date for now
        annualLeaveQuota: e.annual_leave_quota || 0,
        annualLeaveUsed: e.annual_leave_used || 0,
      }));

      const branchesData = branchRes.data.data || [];
      const mappedBranches = branchesData.map((b: any) => ({
        id: b.id,
        name: b.name,
        code: b.code,
        isActive: b.is_active,
      }));

      setEmployees(mappedEmps);
      setBranches(mappedBranches);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal memuat data karyawan");
    } finally {
      setLoading(false);
    }
  };

  // Save employee
  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        nik: form.nik,
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        position: form.position,
        division: form.division,
        branch_id: form.branchId,
        role: form.role,
        annual_leave_quota: parseInt(form.annualLeaveQuota as unknown as string),
      };

      if (editingEmployee) {
        // If password is empty, don't send it in update
        if (!payload.password) {
          delete (payload as any).password;
        }
        await api.put(`/admin/employees/${editingEmployee.id}`, payload);
        toast.success(`Data karyawan ${form.name} berhasil diperbarui!`);
      } else {
        await api.post('/admin/employees', payload);
        toast.success(`Karyawan ${form.name} berhasil ditambahkan!`);
      }

      setShowModal(false);
      setEditingEmployee(null);
      setForm({
        nik: "",
        name: "",
        email: "",
        phone: "",
        password: "",
        position: "",
        division: "",
        branchId: "",
        role: "KARYAWAN",
        annualLeaveQuota: 12,
      });
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal menyimpan karyawan");
    } finally {
      setSaving(false);
    }
  };

  const openCreateModal = () => {
    setEditingEmployee(null);
    setForm({
      nik: "",
      name: "",
      email: "",
      phone: "",
      password: "",
      position: "",
      division: "",
      branchId: "",
      role: "KARYAWAN",
      annualLeaveQuota: 12,
    });
    setShowModal(true);
  };

  const openEditModal = (emp: User) => {
    setEditingEmployee(emp);
    setForm({
      nik: emp.nik,
      name: emp.name,
      email: emp.email,
      phone: emp.phone || "",
      password: "", // Leave blank for edit unless they want to change it
      position: emp.position || "",
      division: emp.division || "",
      branchId: emp.branchId || "",
      role: emp.role,
      annualLeaveQuota: emp.annualLeaveQuota || 12,
    });
    setShowModal(true);
  };

  // Toggle active status
  const handleToggleActive = async (user: User) => {
    const newStatus = !user.isActive;
    const action = newStatus ? "mengaktifkan" : "menonaktifkan";
    if (!window.confirm(`Yakin ingin ${action} ${user.name}?`)) return;

    try {
      await api.put(`/admin/employees/${user.id}`, { is_active: newStatus });
      toast.success(`${user.name} berhasil di${action}.`);
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Gagal ${action} karyawan.`);
    }
  };

  // Reset password
  const handleResetPassword = async (user: User) => {
    const newPassword = window.prompt(
      `Masukkan password baru untuk ${user.name}:`,
      ""
    );
    if (!newPassword) return;
    if (newPassword.length < 6) {
      toast.error("Password minimal 6 karakter");
      return;
    }

    try {
      await api.put(`/admin/employees/${user.id}`, { password: newPassword });
      toast.success(`Password ${user.name} berhasil direset.`);
    } catch (error: any) {
      toast.error(error.message || "Gagal reset password");
    }
  };

  // Filter
  const filteredEmployees = employees
    .filter((emp) => {
      if (filterBranch !== "all" && emp.branchId !== filterBranch) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          emp.name.toLowerCase().includes(q) ||
          emp.nik.toLowerCase().includes(q) ||
          emp.email.toLowerCase().includes(q)
        );
      }
      return true;
    });

  const getBranchName = (branchId: string) =>
    branches.find((b) => b.id === branchId)?.name || "-";

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
          <h1 className="page-title">Manajemen Karyawan</h1>
          <p className="page-subtitle">{employees.length} karyawan terdaftar</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={openCreateModal}
        >
          <Plus size={18} />
          Tambah Karyawan
        </button>
      </div>

      {/* Filter */}
      <div className="card" style={{ marginBottom: "20px" }}>
        <div className="filter-bar">
          <div style={{ position: "relative", flex: 1, maxWidth: "300px" }}>
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
              placeholder="Cari nama, NIK, atau email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            className="form-select"
            value={filterBranch}
            onChange={(e) => setFilterBranch(e.target.value)}
          >
            <option value="all">Semua Cabang</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>NIK</th>
                <th>Nama</th>
                <th>Email</th>
                <th>Jabatan</th>
                <th>Divisi</th>
                <th>Cabang</th>
                <th>Role</th>
                <th>Status</th>
                <th style={{ textAlign: "center" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "40px" }}>
                    <Loader2
                      size={24}
                      className="animate-spin"
                      style={{
                        color: "var(--color-primary)",
                        display: "inline-block",
                      }}
                    />
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <div className="empty-state">
                      <p className="empty-state-title">
                        Tidak ada karyawan ditemukan
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id}>
                    <td>
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontWeight: 600,
                          color: "var(--color-primary)",
                        }}
                      >
                        {emp.nik}
                      </span>
                    </td>
                    <td style={{ fontWeight: 500 }}>{emp.name}</td>
                    <td style={{ color: "var(--color-text-secondary)", fontSize: "0.8125rem" }}>
                      {emp.email}
                    </td>
                    <td>{emp.position || "-"}</td>
                    <td>{emp.division || "-"}</td>
                    <td>{getBranchName(emp.branchId)}</td>
                    <td>
                      <span
                        className={`badge ${
                          emp.role === "super_admin"
                            ? "purple"
                            : emp.role === "supervisor"
                            ? "info"
                            : "gray"
                        }`}
                      >
                        {ROLE_LABELS[emp.role]}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          emp.isActive ? "success" : "danger"
                        }`}
                      >
                        {emp.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          gap: "4px",
                          justifyContent: "center",
                        }}
                      >
                        <button
                          className="btn btn-ghost btn-icon btn-sm"
                          title="Edit"
                          onClick={() => openEditModal(emp)}
                        >
                          <Edit size={14} />
                        </button>
                        {isSuperAdmin && (
                          <>
                            <button
                              className="btn btn-ghost btn-icon btn-sm"
                              title="Reset Password"
                              onClick={() => handleResetPassword(emp)}
                            >
                              <Key size={14} />
                            </button>
                            <button
                              className="btn btn-ghost btn-icon btn-sm"
                              title={emp.isActive ? "Nonaktifkan" : "Aktifkan"}
                              onClick={() => handleToggleActive(emp)}
                            >
                              {emp.isActive ? (
                                <ToggleRight
                                  size={14}
                                  style={{ color: "var(--color-success)" }}
                                />
                              ) : (
                                <ToggleLeft
                                  size={14}
                                  style={{ color: "var(--color-text-muted)" }}
                                />
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Employee Modal */}
      {showModal && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div className="modal" style={{ maxWidth: "600px" }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingEmployee ? "Edit Karyawan" : "Tambah Karyawan Baru"}</h3>
              <button
                className="btn btn-ghost btn-icon"
                onClick={() => setShowModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveEmployee}>
              <div className="modal-body">
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                  }}
                >
                  <div className="form-group">
                    <label className="form-label">NIK (4 digit) *</label>
                    <input
                      type="text"
                      className="form-input"
                      maxLength={4}
                      pattern="\d{4}"
                      required
                      placeholder="0001"
                      value={form.nik}
                      onChange={(e) =>
                        setForm({ ...form, nik: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nama Lengkap *</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      placeholder="Nama lengkap"
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email *</label>
                    <input
                      type="email"
                      className="form-input"
                      required
                      placeholder="email@sgm.com"
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">No. HP</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="08xxxxxxxxxx"
                      value={form.phone}
                      onChange={(e) =>
                        setForm({ ...form, phone: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Password *</label>
                    <input
                      type="password"
                      className="form-input"
                      required={!editingEmployee}
                      minLength={6}
                      placeholder={editingEmployee ? "Kosongkan jika tidak ingin mengubah password" : "Min. 6 karakter"}
                      value={form.password}
                      onChange={(e) =>
                        setForm({ ...form, password: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Jabatan</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Staff, Manager, dll"
                      value={form.position}
                      onChange={(e) =>
                        setForm({ ...form, position: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Divisi</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="IT, Marketing, dll"
                      value={form.division}
                      onChange={(e) =>
                        setForm({ ...form, division: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Cabang *</label>
                    <select
                      className="form-select"
                      required
                      value={form.branchId}
                      onChange={(e) =>
                        setForm({ ...form, branchId: e.target.value })
                      }
                    >
                      <option value="">Pilih cabang</option>
                      {branches
                        .filter((b) => b.isActive)
                        .map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Role *</label>
                    <select
                      className="form-select"
                      value={form.role}
                      onChange={(e) =>
                        setForm({ ...form, role: e.target.value })
                      }
                    >
                      <option value="KARYAWAN">Karyawan</option>
                      {isSuperAdmin && (
                        <>
                          <option value="SUPERVISOR">Supervisor</option>
                          <option value="SUPER_ADMIN">Super Admin</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Kuota Cuti Tahunan</label>
                    <input
                      type="number"
                      className="form-input"
                      min={0}
                      max={30}
                      value={form.annualLeaveQuota}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          annualLeaveQuota: parseInt(e.target.value) || 7,
                        })
                      }
                    />
                  </div>
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
                    <Plus size={16} />
                  )}
                  {saving ? "Menyimpan..." : editingEmployee ? "Simpan Perubahan" : "Tambah Karyawan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
