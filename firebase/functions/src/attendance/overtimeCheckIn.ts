/**
 * Overtime Check-in/Check-out Cloud Function
 * Handles attendance for approved overtime sessions
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import * as admin from "firebase-admin";
import { isWithinGeofence } from "../utils/haversine";
import { toDateString } from "../utils/dateHelpers";
import { UserDoc, BranchDoc, OvertimeRequestDoc } from "../utils/types";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = getFirestore();

export const submitOvertimeAttendance = onCall(
  { region: "asia-southeast2" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Harus login terlebih dahulu.");
    }

    const userId = request.auth.uid;
    const {
      overtimeRequestId,
      latitude,
      longitude,
      gpsAccuracyMeters,
      type, // CHECK_IN or CHECK_OUT
    } = request.data;

    if (!overtimeRequestId || latitude == null || longitude == null || !type) {
      throw new HttpsError(
        "invalid-argument",
        "Data tidak lengkap."
      );
    }

    // Get overtime request
    const otDoc = await db
      .collection("overtime_requests")
      .doc(overtimeRequestId)
      .get();
    if (!otDoc.exists) {
      throw new HttpsError("not-found", "Pengajuan lembur tidak ditemukan.");
    }

    const otData = otDoc.data() as OvertimeRequestDoc;

    // Verify ownership
    if (otData.userId !== userId) {
      throw new HttpsError(
        "permission-denied",
        "Anda tidak berhak check-in lembur ini."
      );
    }

    // Verify status
    if (otData.status !== "DISETUJUI") {
      throw new HttpsError(
        "failed-precondition",
        "Lembur belum disetujui atau sudah selesai."
      );
    }

    // Get user data
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data() as UserDoc;

    // Get branch for geofence
    const branchDoc = await db
      .collection("branches")
      .doc(otData.branchId)
      .get();
    const branchData = branchDoc.data() as BranchDoc;

    // Validate GPS
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
        `Anda di luar area kantor. Jarak: ${geofenceResult.distance}m.`
      );
    }

    const now = Timestamp.now();

    if (type === "CHECK_IN") {
      // Check-in lembur
      if (otData.actualCheckIn) {
        throw new HttpsError(
          "already-exists",
          "Anda sudah check-in lembur."
        );
      }

      await otDoc.ref.update({
        actualCheckIn: now,
        updatedAt: now,
      });

      return {
        success: true,
        message: "Check-in lembur berhasil.",
      };
    } else {
      // Check-out lembur
      if (!otData.actualCheckIn) {
        throw new HttpsError(
          "failed-precondition",
          "Anda belum check-in lembur."
        );
      }

      if (otData.actualCheckOut) {
        throw new HttpsError(
          "already-exists",
          "Anda sudah check-out lembur."
        );
      }

      // Calculate actual hours
      const checkInTime = otData.actualCheckIn.toDate();
      const checkOutTime = now.toDate();
      const diffMs = checkOutTime.getTime() - checkInTime.getTime();
      const actualHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;

      await otDoc.ref.update({
        actualCheckOut: now,
        actualHours,
        status: "SELESAI",
        updatedAt: now,
      });

      return {
        success: true,
        message: `Check-out lembur berhasil. Total: ${actualHours} jam.`,
        actualHours,
      };
    }
  }
);
