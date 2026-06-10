/**
 * Export Recap to Excel (.xlsx)
 * Uses ExcelJS to generate professional spreadsheet
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import * as admin from "firebase-admin";
import * as ExcelJS from "exceljs";
import { UserDoc, RecapRow } from "../utils/types";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = getFirestore();
const storage = getStorage();

export const exportRecapExcel = onCall(
  {
    region: "asia-southeast2",
    memory: "512MiB",
    timeoutSeconds: 120,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Harus login terlebih dahulu.");
    }

    const { recapData, startDate, endDate, totalWorkingDays, branchName } =
      request.data;

    if (!recapData || !startDate || !endDate) {
      throw new HttpsError("invalid-argument", "Data rekap tidak lengkap.");
    }

    const rows: RecapRow[] = recapData;

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "SGM Hadir";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet("Rekap Kehadiran", {
      pageSetup: {
        orientation: "landscape",
        fitToPage: true,
        fitToWidth: 1,
      },
    });

    // ===== HEADER =====
    // Company name
    sheet.mergeCells("A1:N1");
    const titleCell = sheet.getCell("A1");
    titleCell.value = "PT SALUT GAJAH MADA";
    titleCell.font = { size: 16, bold: true, color: { argb: "FF1E40AF" } };
    titleCell.alignment = { horizontal: "center" };

    // Report title
    sheet.mergeCells("A2:N2");
    const subtitleCell = sheet.getCell("A2");
    subtitleCell.value = "REKAP KEHADIRAN KARYAWAN";
    subtitleCell.font = { size: 14, bold: true };
    subtitleCell.alignment = { horizontal: "center" };

    // Period
    sheet.mergeCells("A3:N3");
    const periodCell = sheet.getCell("A3");
    periodCell.value = `Periode: ${formatDate(startDate)} s/d ${formatDate(endDate)}`;
    periodCell.font = { size: 11 };
    periodCell.alignment = { horizontal: "center" };

    // Branch filter
    if (branchName) {
      sheet.mergeCells("A4:N4");
      const branchCell = sheet.getCell("A4");
      branchCell.value = `Cabang: ${branchName}`;
      branchCell.font = { size: 11 };
      branchCell.alignment = { horizontal: "center" };
    }

    // Info
    sheet.mergeCells("A5:N5");
    const infoCell = sheet.getCell("A5");
    infoCell.value = `Total Hari Kerja Efektif: ${totalWorkingDays} hari`;
    infoCell.font = { size: 11, italic: true };
    infoCell.alignment = { horizontal: "center" };

    // Empty row
    const startRow = 7;

    // ===== TABLE HEADER =====
    const headers = [
      "No",
      "NIK",
      "Nama Karyawan",
      "Divisi",
      "Cabang",
      "Hadir",
      "Terlambat",
      "Menit Telat",
      "Sakit",
      "Cuti",
      "Izin Lain",
      "Alpha",
      "Jam Lembur",
      "% Kehadiran",
    ];

    const headerRow = sheet.getRow(startRow);
    headers.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = header;
      cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF1E40AF" },
      };
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
    headerRow.height = 30;

    // ===== DATA ROWS =====
    rows.forEach((row, index) => {
      const dataRow = sheet.getRow(startRow + 1 + index);
      const values = [
        index + 1,
        row.nik,
        row.name,
        row.division,
        row.branchName,
        row.totalPresent,
        row.totalLate,
        row.totalLateMinutes,
        row.totalSick,
        row.totalAnnualLeave,
        row.totalOtherLeave,
        row.totalAlpha,
        row.totalOvertimeHours,
        `${row.attendancePercentage}%`,
      ];

      values.forEach((value, colIndex) => {
        const cell = dataRow.getCell(colIndex + 1);
        cell.value = value;
        cell.alignment = {
          horizontal: colIndex < 5 ? "left" : "center",
          vertical: "middle",
        };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };

        // Highlight alpha cells in red
        if (colIndex === 11 && (value as number) > 0) {
          cell.font = { color: { argb: "FFDC2626" }, bold: true };
        }

        // Highlight low attendance in orange
        if (colIndex === 13) {
          const pct = row.attendancePercentage;
          if (pct < 75) {
            cell.font = { color: { argb: "FFDC2626" }, bold: true };
          } else if (pct < 90) {
            cell.font = { color: { argb: "FFF59E0B" }, bold: true };
          } else {
            cell.font = { color: { argb: "FF10B981" }, bold: true };
          }
        }
      });

      // Alternating row colors
      if (index % 2 === 1) {
        dataRow.eachCell((cell) => {
          if (!cell.fill || cell.fill.type !== "pattern") {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFF0F4FF" },
            };
          }
        });
      }
    });

    // ===== SUMMARY ROW =====
    const summaryRowIndex = startRow + 1 + rows.length;
    const summaryRow = sheet.getRow(summaryRowIndex);

    const avgPresent =
      rows.length > 0
        ? Math.round(
            rows.reduce((s, r) => s + r.totalPresent, 0) / rows.length
          )
        : 0;
    const avgPct =
      rows.length > 0
        ? Math.round(
            (rows.reduce((s, r) => s + r.attendancePercentage, 0) /
              rows.length) *
              100
          ) / 100
        : 0;

    const summaryValues = [
      "",
      "",
      `RATA-RATA (${rows.length} karyawan)`,
      "",
      "",
      avgPresent,
      Math.round(rows.reduce((s, r) => s + r.totalLate, 0) / rows.length),
      Math.round(
        rows.reduce((s, r) => s + r.totalLateMinutes, 0) / rows.length
      ),
      rows.reduce((s, r) => s + r.totalSick, 0),
      rows.reduce((s, r) => s + r.totalAnnualLeave, 0),
      rows.reduce((s, r) => s + r.totalOtherLeave, 0),
      rows.reduce((s, r) => s + r.totalAlpha, 0),
      Math.round(
        rows.reduce((s, r) => s + r.totalOvertimeHours, 0) * 100
      ) / 100,
      `${avgPct}%`,
    ];

    summaryValues.forEach((value, colIndex) => {
      const cell = summaryRow.getCell(colIndex + 1);
      cell.value = value;
      cell.font = { bold: true, size: 10 };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE5E7EB" },
      };
      cell.border = {
        top: { style: "medium" },
        left: { style: "thin" },
        bottom: { style: "medium" },
        right: { style: "thin" },
      };
      cell.alignment = {
        horizontal: colIndex < 5 ? "left" : "center",
      };
    });

    // ===== COLUMN WIDTHS =====
    sheet.columns = [
      { width: 5 },   // No
      { width: 8 },   // NIK
      { width: 25 },  // Nama
      { width: 15 },  // Divisi
      { width: 18 },  // Cabang
      { width: 8 },   // Hadir
      { width: 10 },  // Terlambat
      { width: 12 },  // Menit Telat
      { width: 7 },   // Sakit
      { width: 7 },   // Cuti
      { width: 10 },  // Izin Lain
      { width: 7 },   // Alpha
      { width: 12 },  // Jam Lembur
      { width: 13 },  // % Kehadiran
    ];

    // ===== FOOTER =====
    const footerRow = summaryRowIndex + 3;
    sheet.mergeCells(`A${footerRow}:N${footerRow}`);
    const footerCell = sheet.getCell(`A${footerRow}`);
    footerCell.value = `Dicetak pada: ${new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}`;
    footerCell.font = { size: 9, italic: true, color: { argb: "FF6B7280" } };

    // Signature area
    const sigRow = footerRow + 2;
    sheet.mergeCells(`J${sigRow}:N${sigRow}`);
    sheet.getCell(`J${sigRow}`).value = "Mengetahui,";
    sheet.getCell(`J${sigRow}`).alignment = { horizontal: "center" };

    sheet.mergeCells(`J${sigRow + 4}:N${sigRow + 4}`);
    sheet.getCell(`J${sigRow + 4}`).value = "(_________________________)";
    sheet.getCell(`J${sigRow + 4}`).alignment = { horizontal: "center" };

    sheet.mergeCells(`J${sigRow + 5}:N${sigRow + 5}`);
    sheet.getCell(`J${sigRow + 5}`).value = "HRD / Supervisor";
    sheet.getCell(`J${sigRow + 5}`).alignment = { horizontal: "center" };

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Upload to Firebase Storage
    const fileName = `exports/rekap_kehadiran_${startDate}_${endDate}_${Date.now()}.xlsx`;
    const bucket = storage.bucket();
    const file = bucket.file(fileName);

    await file.save(Buffer.from(buffer as ArrayBuffer), {
      metadata: {
        contentType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });

    // Generate signed URL (valid for 1 hour)
    const [url] = await file.getSignedUrl({
      action: "read",
      expires: Date.now() + 60 * 60 * 1000,
    });

    return {
      success: true,
      downloadUrl: url,
      fileName: `Rekap_Kehadiran_${startDate}_${endDate}.xlsx`,
    };
  }
);

function formatDate(dateStr: string): string {
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];
  const [y, m, d] = dateStr.split("-");
  return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`;
}
