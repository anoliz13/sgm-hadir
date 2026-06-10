/**
 * Date helper utilities
 * Semua timestamp disimpan UTC, ditampilkan WIB (UTC+7)
 */

import { Timestamp } from "firebase-admin/firestore";

const WIB_OFFSET_HOURS = 7;
const WIB_OFFSET_MS = WIB_OFFSET_HOURS * 60 * 60 * 1000;

/**
 * Konversi UTC Date ke WIB Date
 */
export function utcToWib(date: Date): Date {
  return new Date(date.getTime() + WIB_OFFSET_MS);
}

/**
 * Get current time in WIB
 */
export function nowWib(): Date {
  return utcToWib(new Date());
}

/**
 * Format date ke string "YYYY-MM-DD" dalam WIB
 */
export function toDateString(date: Date): string {
  const wibDate = utcToWib(date);
  const year = wibDate.getUTCFullYear();
  const month = String(wibDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(wibDate.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Format date ke string "HH:MM" dalam WIB
 */
export function toTimeString(date: Date): string {
  const wibDate = utcToWib(date);
  const hours = String(wibDate.getUTCHours()).padStart(2, "0");
  const minutes = String(wibDate.getUTCMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

/**
 * Parse time string "HH:MM" ke menit sejak midnight
 */
export function parseTimeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Hitung menit keterlambatan
 * Returns 0 jika tepat waktu, positive number jika terlambat
 */
export function calculateLateMinutes(
  checkInTime: Date,
  scheduledTime: string,
  toleranceMinutes: number
): number {
  const wibCheckIn = utcToWib(checkInTime);
  const checkInMinutes =
    wibCheckIn.getUTCHours() * 60 + wibCheckIn.getUTCMinutes();
  const scheduledMinutes = parseTimeToMinutes(scheduledTime);
  const effectiveScheduled = scheduledMinutes + toleranceMinutes;

  if (checkInMinutes <= effectiveScheduled) {
    return 0;
  }
  return checkInMinutes - scheduledMinutes;
}

/**
 * Tentukan status absensi check-in
 */
export function determineCheckInStatus(
  checkInTime: Date,
  scheduledCheckIn: string,
  scheduledCheckOut: string,
  toleranceMinutes: number
): "TEPAT_WAKTU" | "TERLAMBAT" | "SETENGAH_HARI" {
  const lateMinutes = calculateLateMinutes(
    checkInTime,
    scheduledCheckIn,
    toleranceMinutes
  );

  if (lateMinutes === 0) {
    return "TEPAT_WAKTU";
  }

  // Jika terlambat lebih dari setengah hari kerja
  const workDayMinutes =
    parseTimeToMinutes(scheduledCheckOut) -
    parseTimeToMinutes(scheduledCheckIn);
  if (lateMinutes > workDayMinutes / 2) {
    return "SETENGAH_HARI";
  }

  return "TERLAMBAT";
}

/**
 * Tentukan status absensi check-out
 */
export function determineCheckOutStatus(
  checkOutTime: Date,
  scheduledCheckOut: string
): "TEPAT_WAKTU" | "PULANG_AWAL" {
  const wibCheckOut = utcToWib(checkOutTime);
  const checkOutMinutes =
    wibCheckOut.getUTCHours() * 60 + wibCheckOut.getUTCMinutes();
  const scheduledMinutes = parseTimeToMinutes(scheduledCheckOut);

  if (checkOutMinutes < scheduledMinutes) {
    return "PULANG_AWAL";
  }
  return "TEPAT_WAKTU";
}

/**
 * Cek apakah tanggal adalah weekend (Sabtu/Minggu)
 */
export function isWeekend(dateStr: string): boolean {
  const date = new Date(dateStr + "T00:00:00Z");
  const day = date.getUTCDay();
  return day === 0 || day === 6; // 0=Minggu, 6=Sabtu
}

/**
 * Hitung hari kerja efektif dalam rentang tanggal
 * Exclude weekend dan hari libur
 */
export function countWorkingDays(
  startDate: string,
  endDate: string,
  holidays: string[],
  workDays: number[] = [1, 2, 3, 4, 5] // Sen-Jum
): number {
  let count = 0;
  const start = new Date(startDate + "T00:00:00Z");
  const end = new Date(endDate + "T00:00:00Z");
  const holidaySet = new Set(holidays);

  const current = new Date(start);
  while (current <= end) {
    const dateStr = current.toISOString().split("T")[0];
    const dayOfWeek = current.getUTCDay(); // 0=Sun, 1=Mon, ... 6=Sat

    if (workDays.includes(dayOfWeek) && !holidaySet.has(dateStr)) {
      count++;
    }

    current.setUTCDate(current.getUTCDate() + 1);
  }

  return count;
}

/**
 * Generate array tanggal antara startDate dan endDate (inclusive)
 */
export function getDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const start = new Date(startDate + "T00:00:00Z");
  const end = new Date(endDate + "T00:00:00Z");

  const current = new Date(start);
  while (current <= end) {
    dates.push(current.toISOString().split("T")[0]);
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
}

/**
 * Convert Firestore Timestamp to JS Date
 */
export function timestampToDate(timestamp: Timestamp): Date {
  return timestamp.toDate();
}
