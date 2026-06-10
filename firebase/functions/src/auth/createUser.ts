/**
 * Auth Cloud Functions
 * - createEmployee: Admin membuat akun karyawan baru
 * - resetEmployeePassword: Admin reset password karyawan
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import * as admin from "firebase-admin";

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = getFirestore();
const auth = getAuth();

/**
 * Create new employee account
 * Only SUPER_ADMIN and SUPERVISOR can call this
 */
export const createEmployee = onCall(
  { region: "asia-southeast2" },
  async (request) => {
    // Verify caller is authenticated
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Harus login terlebih dahulu.");
    }

    // Verify caller role
    const callerDoc = await db
      .collection("users")
      .doc(request.auth.uid)
      .get();
    const callerData = callerDoc.data();
    if (
      !callerData ||
      !["SUPER_ADMIN", "SUPERVISOR"].includes(callerData.role)
    ) {
      throw new HttpsError(
        "permission-denied",
        "Hanya Super Admin atau Supervisor yang bisa membuat akun karyawan."
      );
    }

    const {
      nik,
      name,
      email,
      phone,
      position,
      division,
      branchId,
      role,
      password,
      annualLeaveQuota,
    } = request.data;

    // Validate required fields
    if (!nik || !name || !email || !branchId || !role || !password) {
      throw new HttpsError(
        "invalid-argument",
        "NIK, nama, email, cabang, role, dan password wajib diisi."
      );
    }

    // Validate NIK format (4 digit)
    if (!/^\d{4}$/.test(nik)) {
      throw new HttpsError(
        "invalid-argument",
        "NIK harus 4 digit angka."
      );
    }

    // Check NIK uniqueness
    const existingNik = await db
      .collection("users")
      .where("nik", "==", nik)
      .limit(1)
      .get();
    if (!existingNik.empty) {
      throw new HttpsError(
        "already-exists",
        `NIK ${nik} sudah terdaftar.`
      );
    }

    // Validate role
    if (!["SUPER_ADMIN", "SUPERVISOR", "KARYAWAN"].includes(role)) {
      throw new HttpsError("invalid-argument", "Role tidak valid.");
    }

    // Supervisor can only create KARYAWAN
    if (callerData.role === "SUPERVISOR" && role !== "KARYAWAN") {
      throw new HttpsError(
        "permission-denied",
        "Supervisor hanya bisa membuat akun karyawan."
      );
    }

    // Verify branch exists
    const branchDoc = await db.collection("branches").doc(branchId).get();
    if (!branchDoc.exists) {
      throw new HttpsError("not-found", "Cabang tidak ditemukan.");
    }

    try {
      // Create Firebase Auth user
      const userRecord = await auth.createUser({
        email: email,
        password: password,
        displayName: name,
        disabled: false,
      });

      // Set custom claims for role
      await auth.setCustomUserClaims(userRecord.uid, { role });

      // Create Firestore user document
      const now = Timestamp.now();
      await db
        .collection("users")
        .doc(userRecord.uid)
        .set({
          nik,
          name,
          email,
          phone: phone || "",
          photoUrl: "",
          position: position || "",
          division: division || "",
          branchId,
          role,
          supervisorBranchIds: role === "SUPERVISOR" ? [branchId] : [],
          joinDate: now,
          annualLeaveQuota: annualLeaveQuota || 7,
          annualLeaveUsed: 0,
          fcmTokens: [],
          isActive: true,
          createdAt: now,
          updatedAt: now,
        });

      // Log the action
      await db.collection("system_logs").add({
        action: "CREATE_EMPLOYEE",
        targetCollection: "users",
        targetDocId: userRecord.uid,
        performedBy: request.auth.uid,
        performedByName: callerData.name,
        details: { nik, name, email, role, branchId },
        timestamp: now,
      });

      return {
        success: true,
        uid: userRecord.uid,
        message: `Karyawan ${name} (NIK: ${nik}) berhasil didaftarkan.`,
      };
    } catch (error: any) {
      if (error.code === "auth/email-already-exists") {
        throw new HttpsError(
          "already-exists",
          "Email sudah terdaftar di sistem."
        );
      }
      throw new HttpsError(
        "internal",
        `Gagal membuat akun: ${error.message}`
      );
    }
  }
);

/**
 * Reset employee password
 * Only SUPER_ADMIN can reset passwords
 */
export const resetEmployeePassword = onCall(
  { region: "asia-southeast2" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Harus login terlebih dahulu.");
    }

    const callerDoc = await db
      .collection("users")
      .doc(request.auth.uid)
      .get();
    const callerData = callerDoc.data();
    if (!callerData || callerData.role !== "SUPER_ADMIN") {
      throw new HttpsError(
        "permission-denied",
        "Hanya Super Admin yang bisa reset password."
      );
    }

    const { targetUserId, newPassword } = request.data;

    if (!targetUserId || !newPassword) {
      throw new HttpsError(
        "invalid-argument",
        "User ID dan password baru wajib diisi."
      );
    }

    if (newPassword.length < 6) {
      throw new HttpsError(
        "invalid-argument",
        "Password minimal 6 karakter."
      );
    }

    try {
      await auth.updateUser(targetUserId, { password: newPassword });

      await db.collection("system_logs").add({
        action: "RESET_PASSWORD",
        targetCollection: "users",
        targetDocId: targetUserId,
        performedBy: request.auth.uid,
        performedByName: callerData.name,
        details: { note: "Password reset by admin" },
        timestamp: Timestamp.now(),
      });

      return {
        success: true,
        message: "Password berhasil direset.",
      };
    } catch (error: any) {
      throw new HttpsError(
        "internal",
        `Gagal reset password: ${error.message}`
      );
    }
  }
);
