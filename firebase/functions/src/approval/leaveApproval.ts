/**
 * Leave Approval Cloud Function
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import * as admin from "firebase-admin";
import { UserDoc, LeaveRequestDoc } from "../utils/types";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = getFirestore();

export const processLeaveApproval = onCall(
  { region: "asia-southeast2" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Harus login terlebih dahulu.");
    }

    const approverId = request.auth.uid;
    const { requestId, action, note } = request.data;

    if (!requestId || !action) {
      throw new HttpsError("invalid-argument", "Data tidak lengkap.");
    }

    if (!["DISETUJUI", "DITOLAK"].includes(action)) {
      throw new HttpsError("invalid-argument", "Action tidak valid.");
    }

    // Verify approver role
    const approverDoc = await db.collection("users").doc(approverId).get();
    const approverData = approverDoc.data() as UserDoc;

    if (!["SUPER_ADMIN", "SUPERVISOR"].includes(approverData.role)) {
      throw new HttpsError(
        "permission-denied",
        "Anda tidak berhak melakukan approval."
      );
    }

    // Get leave request
    const leaveDoc = await db.collection("leave_requests").doc(requestId).get();
    if (!leaveDoc.exists) {
      throw new HttpsError("not-found", "Pengajuan tidak ditemukan.");
    }

    const leaveData = leaveDoc.data() as LeaveRequestDoc;

    if (leaveData.status !== "PENDING") {
      throw new HttpsError(
        "failed-precondition",
        "Pengajuan sudah diproses sebelumnya."
      );
    }

    // Supervisor can only approve for their branch
    if (
      approverData.role === "SUPERVISOR" &&
      !approverData.supervisorBranchIds.includes(leaveData.branchId)
    ) {
      throw new HttpsError(
        "permission-denied",
        "Anda tidak berhak memproses pengajuan cabang ini."
      );
    }

    const now = Timestamp.now();
    const batch = db.batch();

    // Update leave request
    batch.update(leaveDoc.ref, {
      status: action,
      approvedBy: approverId,
      approvedAt: now,
      rejectionNote: action === "DITOLAK" ? note || null : null,
      updatedAt: now,
    });

    // If approved and deducts quota, update user's leave used
    if (action === "DISETUJUI") {
      const leaveTypeDoc = await db
        .collection("leave_types")
        .doc(leaveData.leaveTypeId)
        .get();

      if (leaveTypeDoc.exists) {
        const leaveTypeData = leaveTypeDoc.data();
        if (leaveTypeData?.deductsQuota) {
          const userRef = db.collection("users").doc(leaveData.userId);
          batch.update(userRef, {
            annualLeaveUsed: admin.firestore.FieldValue.increment(
              leaveData.totalDays
            ),
            updatedAt: now,
          });
        }
      }
    }

    // Create approval log
    const logRef = db.collection("approval_logs").doc();
    batch.set(logRef, {
      requestType: "LEAVE",
      requestId,
      action: action === "DISETUJUI" ? "APPROVED" : "REJECTED",
      actionBy: approverId,
      actionByName: approverData.name,
      note: note || null,
      timestamp: now,
    });

    await batch.commit();

    const statusLabel = action === "DISETUJUI" ? "disetujui" : "ditolak";
    return {
      success: true,
      message: `Pengajuan izin ${leaveData.userName} telah ${statusLabel}.`,
    };
  }
);
