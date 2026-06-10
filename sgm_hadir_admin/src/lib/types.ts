/**
 * TypeScript type definitions for the admin dashboard
 */

export type UserRole =
  | "super_admin"
  | "supervisor"
  | "employee"
  | "kepala_salut"
  | "manajer_salut";

export type AttendanceType = "CHECK_IN" | "CHECK_OUT";

export type AttendanceStatus =
  | "TEPAT_WAKTU"
  | "TERLAMBAT"
  | "SETENGAH_HARI"
  | "PULANG_AWAL";

export type OvertimeStatus =
  | "PENDING"
  | "DISETUJUI"
  | "DITOLAK"
  | "SELESAI"
  | "CANCELLED";

export type LeaveStatus = "PENDING" | "DISETUJUI" | "DITOLAK" | "CANCELLED";

export type VisitVerificationStatus = "PENDING" | "VERIFIED" | "REJECTED";

// ===== User =====
export interface User {
  id: string;
  nik: string;
  name: string;
  email: string;
  phone: string;
  photoUrl: string;
  position: string;
  division: string;
  branchId: string;
  role: UserRole;
  supervisorBranchIds: string[];
  joinDate: Date;
  annualLeaveQuota: number;
  annualLeaveUsed: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ===== Branch =====
export interface WorkSchedule {
  workDays: number[];
  checkInTime: string;
  checkOutTime: string;
  lateToleranceMinutes: number;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  address: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  timezone: string;
  workSchedule: WorkSchedule;
  requireSelfie: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ===== Attendance =====
export interface Attendance {
  id: string;
  userId: string;
  userNik: string;
  userName: string;
  branchId: string;
  branchName: string;
  date: string;
  type: AttendanceType;
  timestamp: Date;
  latitude: number;
  longitude: number;
  gpsAccuracyMeters: number;
  selfieUrl: string | null;
  status: AttendanceStatus;
  lateMinutes: number;
  isServerValidated: boolean;
  isManualEntry: boolean;
  manualEntryBy: string | null;
  manualEntryReason: string | null;
  createdAt: Date;
}

// ===== Overtime Request =====
export interface OvertimeRequest {
  id: string;
  userId: string;
  userNik: string;
  userName: string;
  branchId: string;
  branchName: string;
  date: string;
  estimatedStartTime: string;
  estimatedEndTime: string;
  reason: string;
  status: OvertimeStatus;
  approvedBy: string | null;
  approvedAt: Date | null;
  rejectionNote: string | null;
  actualCheckIn: Date | null;
  actualCheckOut: Date | null;
  actualHours: number | null;
  createdAt: Date;
  updatedAt: Date;
}

// ===== Leave Request =====
export interface LeaveRequest {
  id: string;
  userId: string;
  userNik: string;
  userName: string;
  branchId: string;
  branchName: string;
  leaveTypeId: string;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  attachmentUrls: string[];
  status: LeaveStatus;
  approvedBy: string | null;
  approvedAt: Date | null;
  rejectionNote: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ===== Leave Type =====
export interface LeaveType {
  id: string;
  name: string;
  code: string;
  requiresAttachment: boolean;
  requiresAttachmentAfterDays: number | null;
  deductsQuota: boolean;
  isActive: boolean;
  order: number;
}

// ===== Holiday =====
export interface Holiday {
  id: string;
  name: string;
  date: string;
  type: "NATIONAL" | "COMPANY";
  branchIds: string[] | null;
  year: number;
  createdAt: Date;
}

// ===== Temp Assignment =====
export interface TempAssignment {
  id: string;
  userId: string;
  userNik: string;
  userName: string;
  fromBranchId: string;
  fromBranchName: string;
  toBranchId: string;
  toBranchName: string;
  startDate: string;
  endDate: string;
  assignedBy: string;
  assignedByName: string;
  isActive: boolean;
  createdAt: Date;
}

// ===== Recap =====
export interface RecapRow {
  userId: string;
  nik: string;
  name: string;
  division: string;
  branchName: string;
  shiftName: string;
  totalPresent: number;
  totalLate: number;
  totalLateMinutes: number;
  totalSick: number;
  totalAnnualLeave: number;
  totalOtherLeave: number;
  totalAlpha: number;
  totalOvertimeHours: number;
  effectiveWorkDays: number;
  attendancePercentage: number;
}

export interface RecapSummary {
  avgPresent: number;
  avgLate: number;
  avgAttendancePercentage: number;
  totalEmployees: number;
}

// ===== Status helpers =====
export const STATUS_LABELS: Record<string, string> = {
  TEPAT_WAKTU: "Tepat Waktu",
  TERLAMBAT: "Terlambat",
  SETENGAH_HARI: "Setengah Hari",
  PULANG_AWAL: "Pulang Awal",
  PENDING: "Menunggu",
  DISETUJUI: "Disetujui",
  DITOLAK: "Ditolak",
  SELESAI: "Selesai",
  CANCELLED: "Dibatalkan",
  VERIFIED: "Terverifikasi",
  REJECTED: "Ditolak",
};

export const STATUS_COLORS: Record<string, string> = {
  TEPAT_WAKTU: "success",
  TERLAMBAT: "warning",
  SETENGAH_HARI: "warning",
  PULANG_AWAL: "warning",
  PENDING: "info",
  DISETUJUI: "success",
  DITOLAK: "danger",
  SELESAI: "purple",
  CANCELLED: "gray",
  VERIFIED: "success",
  REJECTED: "danger",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Super Admin",
  supervisor: "Supervisor",
  employee: "Karyawan",
  kepala_salut: "Kepala Salut",
  manajer_salut: "Manajer Salut",
};
