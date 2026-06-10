/**
 * Export Recap to PDF
 * Uses PDFKit to generate professional PDF report
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getStorage } from "firebase-admin/storage";
import * as admin from "firebase-admin";
import PDFDocument from "pdfkit";
import { RecapRow } from "../utils/types";

if (!admin.apps.length) {
  admin.initializeApp();
}

const storage = getStorage();

export const exportRecapPdf = onCall(
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

    // Create PDF
    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margins: { top: 40, bottom: 40, left: 40, right: 40 },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));

    // ===== HEADER =====
    doc
      .fontSize(18)
      .fillColor("#1E40AF")
      .font("Helvetica-Bold")
      .text("PT SALUT GAJAH MADA", { align: "center" });

    doc
      .fontSize(14)
      .fillColor("#000000")
      .text("REKAP KEHADIRAN KARYAWAN", { align: "center" });

    doc.moveDown(0.3);
    doc
      .fontSize(10)
      .font("Helvetica")
      .text(
        `Periode: ${formatDate(startDate)} s/d ${formatDate(endDate)}`,
        { align: "center" }
      );

    if (branchName) {
      doc.text(`Cabang: ${branchName}`, { align: "center" });
    }

    doc.text(`Total Hari Kerja Efektif: ${totalWorkingDays} hari`, {
      align: "center",
    });

    doc.moveDown(1);

    // ===== TABLE =====
    const tableTop = doc.y;
    const colWidths = [25, 35, 120, 65, 55, 40, 40, 40, 35, 35, 40, 35, 45, 50];
    const headers = [
      "No", "NIK", "Nama", "Divisi", "Cabang", "Hadir",
      "Telat", "Mnt", "Sakit", "Cuti", "Izin", "Alpha",
      "Lembur", "% Hadir",
    ];

    let x = 40;
    const rowHeight = 18;

    // Draw header row
    doc.font("Helvetica-Bold").fontSize(7).fillColor("#FFFFFF");
    headers.forEach((header, i) => {
      doc
        .save()
        .rect(x, tableTop, colWidths[i], rowHeight + 4)
        .fill("#1E40AF")
        .restore();

      doc.fillColor("#FFFFFF").text(header, x + 2, tableTop + 5, {
        width: colWidths[i] - 4,
        align: "center",
      });
      x += colWidths[i];
    });

    // Draw data rows
    let y = tableTop + rowHeight + 4;
    doc.font("Helvetica").fontSize(7).fillColor("#000000");

    rows.forEach((row, index) => {
      // Check if we need a new page
      if (y > 520) {
        doc.addPage();
        y = 40;
      }

      x = 40;
      const bgColor = index % 2 === 0 ? "#FFFFFF" : "#F0F4FF";
      const values = [
        String(index + 1),
        row.nik,
        row.name,
        row.division,
        row.branchName || "-",
        String(row.totalPresent),
        String(row.totalLate),
        String(row.totalLateMinutes),
        String(row.totalSick),
        String(row.totalAnnualLeave),
        String(row.totalOtherLeave),
        String(row.totalAlpha),
        String(row.totalOvertimeHours),
        `${row.attendancePercentage}%`,
      ];

      values.forEach((val, i) => {
        doc
          .save()
          .rect(x, y, colWidths[i], rowHeight)
          .fill(bgColor)
          .restore();

        // Color code alpha and attendance percentage
        let textColor = "#000000";
        if (i === 11 && parseInt(val) > 0) textColor = "#DC2626";
        if (i === 13) {
          const pct = row.attendancePercentage;
          if (pct < 75) textColor = "#DC2626";
          else if (pct < 90) textColor = "#F59E0B";
          else textColor = "#10B981";
        }

        doc.fillColor(textColor).text(val, x + 2, y + 5, {
          width: colWidths[i] - 4,
          align: i < 5 ? "left" : "center",
        });
        x += colWidths[i];
      });

      y += rowHeight;
    });

    // ===== FOOTER =====
    doc.moveDown(2);
    const footerY = y + 30;

    doc
      .fontSize(8)
      .fillColor("#6B7280")
      .font("Helvetica")
      .text(
        `Dicetak pada: ${new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}`,
        40,
        footerY
      );

    // Signature
    doc
      .fontSize(9)
      .fillColor("#000000")
      .text("Mengetahui,", 580, footerY, { align: "center", width: 150 });

    doc.text("", 580, footerY + 50, { align: "center", width: 150 });
    doc.text("(_________________________)", 580, footerY + 60, {
      align: "center",
      width: 150,
    });
    doc.text("HRD / Supervisor", 580, footerY + 75, {
      align: "center",
      width: 150,
    });

    // Finalize PDF
    doc.end();

    // Wait for PDF to complete
    const pdfBuffer = await new Promise<Buffer>((resolve) => {
      doc.on("end", () => {
        resolve(Buffer.concat(chunks));
      });
    });

    // Upload to Firebase Storage
    const fileName = `exports/rekap_kehadiran_${startDate}_${endDate}_${Date.now()}.pdf`;
    const bucket = storage.bucket();
    const file = bucket.file(fileName);

    await file.save(pdfBuffer, {
      metadata: { contentType: "application/pdf" },
    });

    const [url] = await file.getSignedUrl({
      action: "read",
      expires: Date.now() + 60 * 60 * 1000,
    });

    return {
      success: true,
      downloadUrl: url,
      fileName: `Rekap_Kehadiran_${startDate}_${endDate}.pdf`,
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
