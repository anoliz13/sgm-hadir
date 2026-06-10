/**
 * Attendance Validation Cloud Function
 * 
 * CRITICAL: GPS validation is done SERVER-SIDE to prevent spoofing.
 * This is the core attendance function that:
 * 1. Verifies auth
 * 2. Rate limits (max 5x per hour)
 * 3. Validates GPS against geofence
 * 4. Determines attendance status
 * 5. Saves to Firestore
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, Timestamp, FieldValue } from "firebase-admin/firestore";
import * as admin from "firebase-admin";
import { isWithinGeofence } from "../utils/haversine";
import {
  toDateString,
  calculateLateMinutes,
  determineCheckInStatus,
  determineCheckOutStatus,
} from "../utils/dateHelpers";
import { UserDoc, BranchDoc, AttendanceDoc } from "../utils/types";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = getFirestore();

// Rate limiting: track check-ins per user per hour
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(userId, {
      count: 1,
      resetTime: now + 60 * 60 * 1000, // 1 hour
    });
    return true;
  }

  if (userLimit.count >= 5) {
    return false;
  }

  userLimit.count++;
  return true;
}

/**
 * Get active branch for user (considering temp assignments)
 */
async function getActiveBranch(
  userId: string,
  dateStr: string
): Promise<{ branchId: string; branchData: BranchDoc }> {
  // Check for active temporary assignment
  const tempAssignments = await db
    .collection("temp_assignments")
    .where("userId", "==", userId)
    .where("isActive", "==", true)
    .where("startDate", "<=", dateStr)
    .get();

  let activeBranchId: string | null = null;

  for (const doc of tempAssignments.docs) {
    const assignment = doc.data();
    if (assignment.endDate >= dateStr) {
      activeBranchId = assignment.toBranchId;
      break;
    }
  }

  // If no temp assignment, use user's default branch
  if (!activeBranchId) {
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data() as UserDoc;
    activeBranchId = userData.branchId;
  }

  const branchDoc = await db
    .collection("branches")
    .doc(activeBranchId)
    .get();
  if (!branchDoc.exists) {
    throw new HttpsError("not-found", "Cabang tidak ditemukan.");
  }

  return {
    branchId: activeBranchId,
    branchData: branchDoc.data() as BranchDoc,
  };
}

export const submitAttendance = onCall(
  {
    region: "asia-southeast2",
    memory: "256MiB",
  },
  async (request) => {
    // 1. Verify authentication
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Harus login terlebih dahulu.");
    }

    const userId = request.auth.uid;

    // 2. Rate limiting
    if (!checkRateLimit(userId)) {
      throw new HttpsError(
        "resource-exhausted",
        "Terlalu banyak percobaan absensi. Maksimal 5 kali per jam."
      );
    }

    // 3. Extract request data
    const {
      latitude,
      longitude,
      gpsAccuracyMeters,
      selfieUrl,
      type, // CHECK_IN or CHECK_OUT
      selectedBranchId, // Optional: jika karyawan memilih cabang manual
    } = request.data;

    // Validate required fields
    if (latitude == null || longitude == null || !type) {
      throw new HttpsError(
        "invalid-argument",
        "Koordinat GPS dan tipe absensi wajib diisi."
      );
    }

    if (!["CHECK_IN", "CHECK_OUT"].includes(type)) {
      throw new HttpsError(
        "invalid-argument",
        "Tipe absensi harus CHECK_IN atau CHECK_OUT."
      );
    }

    // Validate GPS accuracy (reject if too inaccurate)
    if (gpsAccuracyMeters && gpsAccuracyMeters > 100) {
      throw new HttpsError(
        "failed-precondition",
        `Akurasi GPS terlalu rendah (${Math.round(gpsAccuracyMeters)}m). ` +
          "Pastikan GPS aktif dan berada di area terbuka."
      );
    }

    // 4. Get user data
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      throw new HttpsError("not-found", "Data karyawan tidak ditemukan.");
    }
    const userData = userDoc.data() as UserDoc;

    if (!userData.isActive) {
      throw new HttpsError(
        "permission-denied",
        "Akun Anda tidak aktif. Hubungi admin."
      );
    }

    const now = new Date();
    const todayStr = toDateString(now);

    // 5. Get active branch (with temp assignment check)
    let branchId: string;
    let branchData: BranchDoc;

    if (selectedBranchId) {
      // User manually selected a branch
      const branchDoc = await db
        .collection("branches")
        .doc(selectedBranchId)
        .get();
      if (!branchDoc.exists) {
        throw new HttpsError("not-found", "Cabang yang dipilih tidak ditemukan.");
      }
      branchId = selectedBranchId;
      branchData = branchDoc.data() as BranchDoc;
    } else {
      const activeBranch = await getActiveBranch(userId, todayStr);
      branchId = activeBranch.branchId;
      branchData = activeBranch.branchData;
    }

    if (!branchData.isActive) {
      throw new HttpsError(
        "failed-precondition",
        "Cabang tidak aktif. Hubungi admin."
      );
    }

    // 6. GPS Geofence validation (SERVER-SIDE)
    const geofenceResult = isWithinGeofence(
      latitude,
      longitude,
      branchData.latitude,
      branchData.longitude,
      branchData.radiusMeters
    );

    if (!geofenceResult.isInside) {
      throw new HttpsError(
        "failed-precondition",
        `Anda berada di luar area kantor ${branchData.name}. ` +
          `Jarak: ${geofenceResult.distance} meter (max: ${branchData.radiusMeters} meter).`
      );
    }

    // 7. Validate selfie if required
    if (branchData.requireSelfie && !selfieUrl) {
      throw new HttpsError(
        "invalid-argument",
        "Foto selfie wajib diambil untuk cabang ini."
      );
    }

    // 8. Check for duplicate attendance
    const existingAttendance = await db
      .collection("attendances")
      .where("userId", "==", userId)
      .where("date", "==", todayStr)
      .where("type", "==", type)
      .limit(1)
      .get();

    if (!existingAttendance.empty) {
      const typeLabel = type === "CHECK_IN" ? "masuk" : "keluar";
      throw new HttpsError(
        "already-exists",
        `Anda sudah absen ${typeLabel} hari ini.`
      );
    }

    // 9. For CHECK_OUT, verify CHECK_IN exists
    if (type === "CHECK_OUT") {
      const checkInExists = await db
        .collection("attendances")
        .where("userId", "==", userId)
        .where("date", "==", todayStr)
        .where("type", "==", "CHECK_IN")
        .limit(1)
        .get();

      if (checkInExists.empty) {
        throw new HttpsError(
          "failed-precondition",
          "Anda belum check-in hari ini. Silakan check-in terlebih dahulu."
        );
      }
    }

    // 10. Determine attendance status
    let status: string;
    let lateMinutes = 0;

    if (type === "CHECK_IN") {
      status = determineCheckInStatus(
        now,
        branchData.workSchedule.checkInTime,
        branchData.workSchedule.checkOutTime,
        branchData.workSchedule.lateToleranceMinutes
      );
      lateMinutes = calculateLateMinutes(
        now,
        branchData.workSchedule.checkInTime,
        branchData.workSchedule.lateToleranceMinutes
      );
    } else {
      status = determineCheckOutStatus(
        now,
        branchData.workSchedule.checkOutTime
      );
    }

    // 11. Save attendance record
    const attendanceData: Omit<AttendanceDoc, ""> = {
      userId,
      userNik: userData.nik,
      userName: userData.name,
      branchId,
      branchName: branchData.name,
      date: todayStr,
      type,
      timestamp: Timestamp.fromDate(now),
      latitude,
      longitude,
      gpsAccuracyMeters: gpsAccuracyMeters || 0,
      selfieUrl: selfieUrl || null,
      status: status as any,
      lateMinutes,
      isServerValidated: true,
      isManualEntry: false,
      manualEntryBy: null,
      manualEntryReason: null,
      createdAt: Timestamp.fromDate(now),
    };

    const docRef = await db.collection("attendances").add(attendanceData);

    // 12. Return success response
    const typeLabel = type === "CHECK_IN" ? "Masuk" : "Keluar";
    const statusLabel =
      status === "TEPAT_WAKTU"
        ? "Tepat Waktu ✅"
        : status === "TERLAMBAT"
        ? `Terlambat ${lateMinutes} menit ⚠️`
        : status === "PULANG_AWAL"
        ? "Pulang Awal ⚠️"
        : "Setengah Hari";

    return {
      success: true,
      attendanceId: docRef.id,
      message: `Absen ${typeLabel} berhasil dicatat.`,
      status: statusLabel,
      data: {
        type,
        status,
        lateMinutes,
        branchName: branchData.name,
        timestamp: now.toISOString(),
        distance: geofenceResult.distance,
      },
    };
  }
);
