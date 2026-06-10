/**
 * Generate Attendance Recap
 * Calculates attendance summary per employee for a given date range
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import * as admin from "firebase-admin";
import { countWorkingDays, getDateRange } from "../utils/dateHelpers";
import { UserDoc, RecapRow } from "../utils/types";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = getFirestore();

export const generateRecap = onCall(
  {
    region: "asia-southeast2",
    memory: "512MiB",
    timeoutSeconds: 120,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Harus login terlebih dahulu.");
    }

    // Verify role
    const callerDoc = await db
      .collection("users")
      .doc(request.auth.uid)
      .get();
    const callerData = callerDoc.data() as UserDoc;

    if (!["SUPER_ADMIN", "SUPERVISOR"].includes(callerData.role)) {
      throw new HttpsError(
        "permission-denied",
        "Anda tidak berhak mengakses rekap."
      );
    }

    const { startDate, endDate, branchId, division, userId } = request.data;

    if (!startDate || !endDate) {
      throw new HttpsError(
        "invalid-argument",
        "Tanggal mulai dan selesai wajib diisi."
      );
    }

    // Get holidays in the period
    const startYear = parseInt(startDate.substring(0, 4));
    const endYear = parseInt(endDate.substring(0, 4));
    const years = Array.from(
      { length: endYear - startYear + 1 },
      (_, i) => startYear + i
    );

    let holidayQuery = db
      .collection("holidays")
      .where("year", "in", years);

    const holidaySnap = await holidayQuery.get();
    const holidays = holidaySnap.docs
      .map((doc) => doc.data().date as string)
      .filter((d) => d >= startDate && d <= endDate);

    // Get employees to include
    let usersQuery: admin.firestore.Query = db
      .collection("users")
      .where("isActive", "==", true);

    if (userId) {
      // Single employee
      const userDoc = await db.collection("users").doc(userId).get();
      if (!userDoc.exists) {
        throw new HttpsError("not-found", "Karyawan tidak ditemukan.");
      }
      const userData = userDoc.data() as UserDoc;

      // Process single employee
      const recap = await processEmployee(
        userId,
        userData,
        startDate,
        endDate,
        holidays
      );
      const totalWorkingDays = countWorkingDays(startDate, endDate, holidays);

      return {
        success: true,
        data: [recap],
        totalWorkingDays,
        period: { startDate, endDate },
      };
    }

    // Filter by branch for supervisors
    if (callerData.role === "SUPERVISOR" && !branchId) {
      // Only their branches
      usersQuery = usersQuery.where(
        "branchId",
        "in",
        callerData.supervisorBranchIds
      );
    } else if (branchId) {
      usersQuery = usersQuery.where("branchId", "==", branchId);
    }

    const usersSnap = await usersQuery.get();
    let employees = usersSnap.docs.map((doc) => ({
      id: doc.id,
      data: doc.data() as UserDoc,
    }));

    // Filter by division if specified
    if (division) {
      employees = employees.filter((e) => e.data.division === division);
    }

    // Process each employee
    const recapRows: RecapRow[] = [];
    for (const emp of employees) {
      const row = await processEmployee(
        emp.id,
        emp.data,
        startDate,
        endDate,
        holidays
      );
      recapRows.push(row);
    }

    // Sort by name
    recapRows.sort((a, b) => a.name.localeCompare(b.name));

    const totalWorkingDays = countWorkingDays(startDate, endDate, holidays);

    return {
      success: true,
      data: recapRows,
      totalWorkingDays,
      period: { startDate, endDate },
      summary: calculateSummary(recapRows, totalWorkingDays),
    };
  }
);

async function processEmployee(
  userId: string,
  userData: UserDoc,
  startDate: string,
  endDate: string,
  holidays: string[]
): Promise<RecapRow> {
  // Get attendances in period
  const attendanceSnap = await db
    .collection("attendances")
    .where("userId", "==", userId)
    .where("date", ">=", startDate)
    .where("date", "<=", endDate)
    .where("type", "==", "CHECK_IN")
    .get();

  let totalPresent = 0;
  let totalLate = 0;
  let totalLateMinutes = 0;
  const presentDates = new Set<string>();

  for (const doc of attendanceSnap.docs) {
    const att = doc.data();
    totalPresent++;
    presentDates.add(att.date);

    if (att.status === "TERLAMBAT" || att.status === "SETENGAH_HARI") {
      totalLate++;
      totalLateMinutes += att.lateMinutes || 0;
    }
  }

  // Get approved leaves in period
  const leavesSnap = await db
    .collection("leave_requests")
    .where("userId", "==", userId)
    .where("status", "==", "DISETUJUI")
    .get();

  let totalSick = 0;
  let totalAnnualLeave = 0;
  let totalOtherLeave = 0;

  for (const doc of leavesSnap.docs) {
    const leave = doc.data();
    // Check if leave dates overlap with the period
    const leaveStart = leave.startDate > startDate ? leave.startDate : startDate;
    const leaveEnd = leave.endDate < endDate ? leave.endDate : endDate;

    if (leaveStart > leaveEnd) continue;

    const leaveDays = countWorkingDays(leaveStart, leaveEnd, holidays);

    switch (leave.leaveTypeName) {
      case "Izin Sakit":
        totalSick += leaveDays;
        break;
      case "Cuti Tahunan":
        totalAnnualLeave += leaveDays;
        break;
      default:
        totalOtherLeave += leaveDays;
    }
  }

  // Get approved overtime hours in period
  const otSnap = await db
    .collection("overtime_requests")
    .where("userId", "==", userId)
    .where("status", "==", "SELESAI")
    .where("date", ">=", startDate)
    .where("date", "<=", endDate)
    .get();

  let totalOvertimeHours = 0;
  for (const doc of otSnap.docs) {
    totalOvertimeHours += doc.data().actualHours || 0;
  }

  // Calculate working days and alpha
  const effectiveWorkDays = countWorkingDays(startDate, endDate, holidays);
  const totalLeave = totalSick + totalAnnualLeave + totalOtherLeave;
  const totalAlpha = Math.max(
    0,
    effectiveWorkDays - totalPresent - totalLeave
  );

  const attendancePercentage =
    effectiveWorkDays > 0
      ? Math.round((totalPresent / effectiveWorkDays) * 10000) / 100
      : 0;

  return {
    userId,
    nik: userData.nik,
    name: userData.name,
    division: userData.division,
    branchName: "",  // Will be populated by join
    totalPresent,
    totalLate,
    totalLateMinutes,
    totalSick,
    totalAnnualLeave,
    totalOtherLeave,
    totalAlpha,
    totalOvertimeHours: Math.round(totalOvertimeHours * 100) / 100,
    effectiveWorkDays,
    attendancePercentage,
  };
}

function calculateSummary(rows: RecapRow[], totalWorkingDays: number) {
  if (rows.length === 0) {
    return {
      avgPresent: 0,
      avgLate: 0,
      avgAttendancePercentage: 0,
      totalEmployees: 0,
    };
  }

  const totalPresent = rows.reduce((sum, r) => sum + r.totalPresent, 0);
  const totalLate = rows.reduce((sum, r) => sum + r.totalLate, 0);
  const avgPercentage =
    rows.reduce((sum, r) => sum + r.attendancePercentage, 0) / rows.length;

  return {
    avgPresent: Math.round((totalPresent / rows.length) * 100) / 100,
    avgLate: Math.round((totalLate / rows.length) * 100) / 100,
    avgAttendancePercentage: Math.round(avgPercentage * 100) / 100,
    totalEmployees: rows.length,
  };
}
