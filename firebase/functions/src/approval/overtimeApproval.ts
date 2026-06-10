/**
 * Overtime Approval Cloud Function
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import * as admin from "firebase-admin";
import { UserDoc, OvertimeRequestDoc } from "../utils/types";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = getFirestore();

export const processOvertimeApproval = onCall(
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

    // Get overtime request
    const otDoc = await db
      .collection("overtime_requests")
      .doc(requestId)
      .get();
    if (!otDoc.exists) {
      throw new HttpsError("not-found", "Pengajuan lembur tidak ditemukan.");
    }

    const otData = otDoc.data() as OvertimeRequestDoc;

    if (otData.status !== "PENDING") {
      throw new HttpsError(
        "failed-precondition",
        "Pengajuan sudah diproses."
      );
    }

    // Supervisor can only approve for their branch
    if (
      approverData.role === "SUPERVISOR" &&
      !approverData.supervisorBranchIds.includes(otData.branchId)
    ) {
      throw new HttpsError(
        "permission-denied",
        "Anda tidak berhak memproses pengajuan cabang ini."
      );
    }

    const now = Timestamp.now();
    const batch = db.batch();

    batch.update(otDoc.ref, {
      status: action,
      approvedBy: approverId,
      approvedAt: now,
      rejectionNote: action === "DITOLAK" ? note || null : null,
      updatedAt: now,
    });

    const logRef = db.collection("approval_logs").doc();
    batch.set(logRef, {
      requestType: "OVERTIME",
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
      message: `Pengajuan lembur ${otData.userName} telah ${statusLabel}.`,
    };
  }
);
