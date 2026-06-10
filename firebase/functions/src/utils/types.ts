/**
 * TypeScript interfaces untuk semua Firestore documents
 */

import { Timestamp } from "firebase-admin/firestore";

export type UserRole = "SUPER_ADMIN" | "SUPERVISOR" | "KARYAWAN";

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

export type HolidayType = "NATIONAL" | "COMPANY";

export type ApprovalAction = "APPROVED" | "REJECTED";

export type RequestType = "LEAVE" | "OVERTIME" | "VISIT";

// ==================== USER ====================
export interface UserDoc {
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
  joinDate: Timestamp;
  annualLeaveQuota: number;
  annualLeaveUsed: number;
  fcmTokens: string[];
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ==================== BRANCH ====================
export interface WorkSchedule {
  workDays: number[];
  checkInTime: string;
  checkOutTime: string;
  lateToleranceMinutes: number;
}

export interface BranchDoc {
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
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ==================== ATTENDANCE ====================
export interface AttendanceDoc {
  userId: string;
  userNik: string;
  userName: string;
  branchId: string;
  branchName: string;
  date: string;
  type: AttendanceType;
  timestamp: Timestamp;
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
  createdAt: Timestamp;
}

// ==================== OVERTIME REQUEST ====================
export interface OvertimeRequestDoc {
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
  approvedAt: Timestamp | null;
  rejectionNote: string | null;
  actualCheckIn: Timestamp | null;
  actualCheckOut: Timestamp | null;
  actualHours: number | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ==================== LEAVE REQUEST ====================
export interface LeaveRequestDoc {
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
  approvedAt: Timestamp | null;
  rejectionNote: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ==================== LEAVE TYPE ====================
export interface LeaveTypeDoc {
  name: string;
  code: string;
  requiresAttachment: boolean;
  requiresAttachmentAfterDays: number | null;
  deductsQuota: boolean;
  isActive: boolean;
  order: number;
}

// ==================== VISIT ====================
export interface VisitDoc {
  userId: string;
  userNik: string;
  userName: string;
  branchId: string;
  clientName: string;
  location: string;
  latitude: number;
  longitude: number;
  type: AttendanceType;
  selfieUrl: string;
  notes: string | null;
  date: string;
  timestamp: Timestamp;
  verificationStatus: VisitVerificationStatus;
  verifiedBy: string | null;
  verifiedAt: Timestamp | null;
  createdAt: Timestamp;
}

// ==================== HOLIDAY ====================
export interface HolidayDoc {
  name: string;
  date: string;
  type: HolidayType;
  branchIds: string[] | null;
  year: number;
  createdAt: Timestamp;
}

// ==================== TEMP ASSIGNMENT ====================
export interface TempAssignmentDoc {
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
  createdAt: Timestamp;
}

// ==================== APPROVAL LOG ====================
export interface ApprovalLogDoc {
  requestType: RequestType;
  requestId: string;
  action: ApprovalAction;
  actionBy: string;
  actionByName: string;
  note: string | null;
  timestamp: Timestamp;
}

// ==================== SYSTEM LOG ====================
export interface SystemLogDoc {
  action: string;
  targetCollection: string;
  targetDocId: string;
  performedBy: string;
  performedByName: string;
  details: Record<string, unknown>;
  timestamp: Timestamp;
}

// ==================== RECAP SNAPSHOT ====================
export interface RecapSnapshotDoc {
  name: string;
  startDate: string;
  endDate: string;
  branchId: string | null;
  division: string | null;
  data: RecapRow[];
  totalWorkingDays: number;
  createdBy: string;
  createdByName: string;
  createdAt: Timestamp;
}

export interface RecapRow {
  userId: string;
  nik: string;
  name: string;
  division: string;
  branchName: string;
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
