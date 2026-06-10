/**
 * Seed Initial Data for Development
 * Creates sample branches, leave types, holidays, and a super admin account
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = getFirestore();
const auth = getAuth();

export const seedInitialData = onCall(
  { region: "asia-southeast2" },
  async (request) => {
    // Only allow in development or first-time setup
    const usersCount = await db.collection("users").limit(1).get();
    if (!usersCount.empty && !request.data?.force) {
      throw new HttpsError(
        "already-exists",
        "Data sudah ada. Gunakan force: true untuk menimpa."
      );
    }

    const now = Timestamp.now();
    const batch = db.batch();

    // ===== BRANCHES =====
    const branches = [
      {
        name: "SGM Kantor Pusat",
        code: "SGM-PST",
        address: "Jl. 22 Metro, Jakarta",
        latitude: -6.2088,
        longitude: 106.8456,
        radiusMeters: 100,
        timezone: "Asia/Jakarta",
        workSchedule: {
          workDays: [1, 2, 3, 4, 5],
          checkInTime: "08:00",
          checkOutTime: "17:00",
          lateToleranceMinutes: 15,
        },
        requireSelfie: false,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: "SGM Cabang Surabaya",
        code: "SGM-SBY",
        address: "Jl. Tunjungan, Surabaya",
        latitude: -7.2575,
        longitude: 112.7521,
        radiusMeters: 100,
        timezone: "Asia/Jakarta",
        workSchedule: {
          workDays: [1, 2, 3, 4, 5],
          checkInTime: "08:00",
          checkOutTime: "17:00",
          lateToleranceMinutes: 15,
        },
        requireSelfie: false,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: "SGM Cabang Bandung",
        code: "SGM-BDG",
        address: "Jl. Braga, Bandung",
        latitude: -6.9175,
        longitude: 107.6191,
        radiusMeters: 100,
        timezone: "Asia/Jakarta",
        workSchedule: {
          workDays: [1, 2, 3, 4, 5],
          checkInTime: "08:00",
          checkOutTime: "17:00",
          lateToleranceMinutes: 15,
        },
        requireSelfie: false,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: "SGM Cabang Semarang",
        code: "SGM-SMG",
        address: "Jl. Pandanaran, Semarang",
        latitude: -6.9666,
        longitude: 110.4196,
        radiusMeters: 100,
        timezone: "Asia/Jakarta",
        workSchedule: {
          workDays: [1, 2, 3, 4, 5],
          checkInTime: "08:00",
          checkOutTime: "17:00",
          lateToleranceMinutes: 15,
        },
        requireSelfie: false,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    ];

    const branchIds: string[] = [];
    for (const branch of branches) {
      const ref = db.collection("branches").doc();
      batch.set(ref, branch);
      branchIds.push(ref.id);
    }

    // ===== LEAVE TYPES =====
    const leaveTypes = [
      {
        name: "Cuti Tahunan",
        code: "CUTI_TAHUNAN",
        requiresAttachment: false,
        requiresAttachmentAfterDays: null,
        deductsQuota: true,
        isActive: true,
        order: 1,
      },
      {
        name: "Izin Sakit",
        code: "SAKIT",
        requiresAttachment: false,
        requiresAttachmentAfterDays: 1,
        deductsQuota: false,
        isActive: true,
        order: 2,
      },
      {
        name: "Izin Keperluan Pribadi",
        code: "PRIBADI",
        requiresAttachment: false,
        requiresAttachmentAfterDays: null,
        deductsQuota: false,
        isActive: true,
        order: 3,
      },
      {
        name: "Izin Keperluan Keluarga",
        code: "KELUARGA",
        requiresAttachment: false,
        requiresAttachmentAfterDays: null,
        deductsQuota: false,
        isActive: true,
        order: 4,
      },
      {
        name: "Izin Tanpa Keterangan",
        code: "TANPA_KETERANGAN",
        requiresAttachment: false,
        requiresAttachmentAfterDays: null,
        deductsQuota: false,
        isActive: true,
        order: 5,
      },
    ];

    for (const lt of leaveTypes) {
      const ref = db.collection("leave_types").doc();
      batch.set(ref, lt);
    }

    // ===== HOLIDAYS 2026 =====
    const holidays2026 = [
      { name: "Tahun Baru 2026", date: "2026-01-01" },
      { name: "Isra Mi'raj Nabi Muhammad SAW", date: "2026-02-08" },
      { name: "Tahun Baru Imlek", date: "2026-02-17" },
      { name: "Hari Raya Nyepi", date: "2026-03-19" },
      { name: "Hari Raya Idul Fitri 1447H (Hari 1)", date: "2026-03-21" },
      { name: "Hari Raya Idul Fitri 1447H (Hari 2)", date: "2026-03-22" },
      { name: "Wafat Isa Al Masih", date: "2026-04-03" },
      { name: "Hari Buruh Internasional", date: "2026-05-01" },
      { name: "Kenaikan Isa Al Masih", date: "2026-05-14" },
      { name: "Hari Lahir Pancasila", date: "2026-06-01" },
      { name: "Hari Raya Idul Adha", date: "2026-05-28" },
      { name: "Tahun Baru Islam 1448H", date: "2026-06-17" },
      { name: "Hari Kemerdekaan RI", date: "2026-08-17" },
      { name: "Maulid Nabi Muhammad SAW", date: "2026-08-27" },
      { name: "Hari Natal", date: "2026-12-25" },
    ];

    for (const h of holidays2026) {
      const ref = db.collection("holidays").doc();
      batch.set(ref, {
        ...h,
        type: "NATIONAL",
        branchIds: null,
        year: 2026,
        createdAt: now,
      });
    }

    await batch.commit();

    // ===== CREATE SUPER ADMIN ACCOUNT =====
    try {
      const adminUser = await auth.createUser({
        email: "admin@sgm-hadir.com",
        password: "admin123456",
        displayName: "Super Admin SGM",
      });

      await auth.setCustomUserClaims(adminUser.uid, { role: "SUPER_ADMIN" });

      await db.collection("users").doc(adminUser.uid).set({
        nik: "0001",
        name: "Super Admin SGM",
        email: "admin@sgm-hadir.com",
        phone: "",
        photoUrl: "",
        position: "Super Admin",
        division: "IT",
        branchId: branchIds[0],
        role: "SUPER_ADMIN",
        supervisorBranchIds: branchIds,
        joinDate: now,
        annualLeaveQuota: 7,
        annualLeaveUsed: 0,
        fcmTokens: [],
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });

      return {
        success: true,
        message: "Data awal berhasil dibuat!",
        adminCredentials: {
          email: "admin@sgm-hadir.com",
          password: "admin123456",
          note: "SEGERA GANTI PASSWORD SETELAH LOGIN PERTAMA!",
        },
        branches: branches.map((b, i) => ({
          id: branchIds[i],
          name: b.name,
          code: b.code,
        })),
      };
    } catch (error: any) {
      return {
        success: true,
        message: "Data cabang dan leave types berhasil dibuat, tapi admin gagal: " + error.message,
      };
    }
  }
);
