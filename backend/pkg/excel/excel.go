package excel

import (
	"fmt"
	"time"

	"github.com/sgm/hadir-backend/internal/dto"
	"github.com/xuri/excelize/v2"
)

// styleHeader creates a dark-blue header style
func styleHeader(f *excelize.File) (int, error) {
	return f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Bold: true, Size: 11, Color: "FFFFFF", Family: "Calibri"},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"1E3A8A"}, Pattern: 1},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center", WrapText: true},
		Border: []excelize.Border{
			{Type: "left", Color: "FFFFFF", Style: 1},
			{Type: "right", Color: "FFFFFF", Style: 1},
			{Type: "top", Color: "FFFFFF", Style: 1},
			{Type: "bottom", Color: "FFFFFF", Style: 1},
		},
	})
}

// styleDataEven creates an even-row data cell style
func styleDataEven(f *excelize.File) (int, error) {
	return f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Size: 10, Family: "Calibri"},
		Alignment: &excelize.Alignment{Vertical: "center"},
		Border: []excelize.Border{
			{Type: "left", Color: "D1D5DB", Style: 1},
			{Type: "right", Color: "D1D5DB", Style: 1},
			{Type: "top", Color: "D1D5DB", Style: 1},
			{Type: "bottom", Color: "D1D5DB", Style: 1},
		},
	})
}

// styleDataOdd creates an odd-row (striped) data cell style
func styleDataOdd(f *excelize.File) (int, error) {
	return f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Size: 10, Family: "Calibri"},
		Fill:      excelize.Fill{Type: "pattern", Color: []string{"EFF6FF"}, Pattern: 1},
		Alignment: &excelize.Alignment{Vertical: "center"},
		Border: []excelize.Border{
			{Type: "left", Color: "D1D5DB", Style: 1},
			{Type: "right", Color: "D1D5DB", Style: 1},
			{Type: "top", Color: "D1D5DB", Style: 1},
			{Type: "bottom", Color: "D1D5DB", Style: 1},
		},
	})
}

// styleDataCenter is like styleDataEven but centered
func styleDataCenter(f *excelize.File, odd bool) (int, error) {
	color := "FFFFFF"
	if odd {
		color = "EFF6FF"
	}
	return f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Size: 10, Family: "Calibri"},
		Fill:      excelize.Fill{Type: "pattern", Color: []string{color}, Pattern: 1},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center"},
		Border: []excelize.Border{
			{Type: "left", Color: "D1D5DB", Style: 1},
			{Type: "right", Color: "D1D5DB", Style: 1},
			{Type: "top", Color: "D1D5DB", Style: 1},
			{Type: "bottom", Color: "D1D5DB", Style: 1},
		},
	})
}

// styleTotal creates a summary/total row style
func styleTotal(f *excelize.File) (int, error) {
	return f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Bold: true, Size: 10, Family: "Calibri"},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"DBEAFE"}, Pattern: 1},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center"},
		Border: []excelize.Border{
			{Type: "left", Color: "1E3A8A", Style: 2},
			{Type: "right", Color: "1E3A8A", Style: 2},
			{Type: "top", Color: "1E3A8A", Style: 2},
			{Type: "bottom", Color: "1E3A8A", Style: 2},
		},
	})
}

// styleTitleMain creates the main title style
func styleTitleMain(f *excelize.File) (int, error) {
	return f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Bold: true, Size: 16, Color: "1E3A8A", Family: "Calibri"},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"EFF6FF"}, Pattern: 1},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center"},
	})
}

// styleTitleSub creates a subtitle style
func styleTitleSub(f *excelize.File) (int, error) {
	return f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Size: 11, Color: "374151", Family: "Calibri"},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"EFF6FF"}, Pattern: 1},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center"},
	})
}

// colName converts 0-based column index to Excel column letter (A, B, ... Z, AA, ...)
func colName(idx int) string {
	name := ""
	idx++
	for idx > 0 {
		idx--
		name = string(rune('A'+idx%26)) + name
		idx /= 26
	}
	return name
}

// GenerateAttendanceReport generates a professional styled Excel file
func GenerateAttendanceReport(data []dto.AttendanceSummary, startDate, endDate time.Time) (*excelize.File, string, error) {
	f := excelize.NewFile()

	sheet := "Rekap Kehadiran"
	index, _ := f.NewSheet(sheet)
	f.SetActiveSheet(index)
	f.DeleteSheet("Sheet1")

	lastCol := "N" // 14 columns: A–N
	totalCols := 14

	// ── Title rows ─────────────────────────────────────────────────────────────
	titleStyle, _ := styleTitleMain(f)
	subStyle, _ := styleTitleSub(f)

	f.MergeCell(sheet, "A1", lastCol+"1")
	f.SetCellValue(sheet, "A1", "PT SALUT GAJAH MADA")
	f.SetCellStyle(sheet, "A1", lastCol+"1", titleStyle)
	f.SetRowHeight(sheet, 1, 30)

	f.MergeCell(sheet, "A2", lastCol+"2")
	f.SetCellValue(sheet, "A2", "LAPORAN REKAP KEHADIRAN KARYAWAN")
	f.SetCellStyle(sheet, "A2", lastCol+"2", titleStyle)
	f.SetRowHeight(sheet, 2, 24)

	f.MergeCell(sheet, "A3", lastCol+"3")
	periodeStr := fmt.Sprintf("Periode: %s s/d %s   |   Dicetak: %s",
		startDate.Format("02 January 2006"),
		endDate.Format("02 January 2006"),
		time.Now().Format("02 January 2006 15:04"),
	)
	f.SetCellValue(sheet, "A3", periodeStr)
	f.SetCellStyle(sheet, "A3", lastCol+"3", subStyle)
	f.SetRowHeight(sheet, 3, 18)

	// blank row 4
	f.SetRowHeight(sheet, 4, 6)

	// ── Column headers (row 5) ─────────────────────────────────────────────────
	headers := []struct {
		label string
		width float64
	}{
		{"NIK", 14},
		{"Nama Karyawan", 28},
		{"Divisi", 16},
		{"Cabang", 18},
		{"Shift", 18},
		{"Hadir\n(Hari)", 10},
		{"Terlambat\n(Hari)", 11},
		{"Menit\nTelat", 10},
		{"Sakit\n(Hari)", 9},
		{"Cuti\n(Hari)", 9},
		{"Alpha\n(Hari)", 9},
		{"Lembur\n(Jam)", 10},
		{"Hari Kerja\nEfektif", 12},
		{"% Kehadiran", 12},
	}

	hStyle, _ := styleHeader(f)
	for i, h := range headers {
		cell := colName(i) + "5"
		f.SetCellValue(sheet, cell, h.label)
		f.SetCellStyle(sheet, cell, cell, hStyle)
		f.SetColWidth(sheet, colName(i), colName(i), h.width)
	}
	f.SetRowHeight(sheet, 5, 36)

	// ── Data rows ──────────────────────────────────────────────────────────────
	evenStyle, _ := styleDataEven(f)
	oddStyle, _ := styleDataOdd(f)
	evenCtr, _ := styleDataCenter(f, false)
	oddCtr, _ := styleDataCenter(f, true)

	// Totals accumulators
	var totHadir, totTerlambat, totSakit, totCuti, totAlpha int
	var totLembur float64

	for i, row := range data {
		rowIdx := i + 6
		isOdd := i%2 == 1
		base := evenStyle
		ctr := evenCtr
		if isOdd {
			base = oddStyle
			ctr = oddCtr
		}

		f.SetCellValue(sheet, fmt.Sprintf("A%d", rowIdx), row.NIK)
		f.SetCellValue(sheet, fmt.Sprintf("B%d", rowIdx), row.Name)
		f.SetCellValue(sheet, fmt.Sprintf("C%d", rowIdx), row.Division)
		f.SetCellValue(sheet, fmt.Sprintf("D%d", rowIdx), row.BranchName)
		f.SetCellValue(sheet, fmt.Sprintf("E%d", rowIdx), row.ShiftName)
		f.SetCellValue(sheet, fmt.Sprintf("F%d", rowIdx), row.TotalHadir)
		f.SetCellValue(sheet, fmt.Sprintf("G%d", rowIdx), row.TotalTerlambat)
		f.SetCellValue(sheet, fmt.Sprintf("H%d", rowIdx), row.LateMinutes)
		f.SetCellValue(sheet, fmt.Sprintf("I%d", rowIdx), row.Sakit)
		f.SetCellValue(sheet, fmt.Sprintf("J%d", rowIdx), row.Cuti)
		f.SetCellValue(sheet, fmt.Sprintf("K%d", rowIdx), row.Alpha)
		f.SetCellValue(sheet, fmt.Sprintf("L%d", rowIdx), row.JamLembur)
		f.SetCellValue(sheet, fmt.Sprintf("M%d", rowIdx), row.HariKerjaEfektif)
		f.SetCellValue(sheet, fmt.Sprintf("N%d", rowIdx), fmt.Sprintf("%.1f%%", row.PersentaseHadir))

		// Apply text style cols A-E, center style cols F-N
		f.SetCellStyle(sheet, fmt.Sprintf("A%d", rowIdx), fmt.Sprintf("E%d", rowIdx), base)
		f.SetCellStyle(sheet, fmt.Sprintf("F%d", rowIdx), fmt.Sprintf("N%d", rowIdx), ctr)
		f.SetRowHeight(sheet, rowIdx, 18)

		totHadir += row.TotalHadir
		totTerlambat += row.TotalTerlambat
		totSakit += row.Sakit
		totCuti += row.Cuti
		totAlpha += row.Alpha
		totLembur += row.JamLembur
	}

	// ── Summary / Total row ────────────────────────────────────────────────────
	if len(data) > 0 {
		sumRow := len(data) + 6
		totStyle, _ := styleTotal(f)

		f.MergeCell(sheet, fmt.Sprintf("A%d", sumRow), fmt.Sprintf("E%d", sumRow))
		f.SetCellValue(sheet, fmt.Sprintf("A%d", sumRow), fmt.Sprintf("TOTAL  (%d Karyawan)", len(data)))
		f.SetCellValue(sheet, fmt.Sprintf("F%d", sumRow), totHadir)
		f.SetCellValue(sheet, fmt.Sprintf("G%d", sumRow), totTerlambat)
		f.SetCellValue(sheet, fmt.Sprintf("H%d", sumRow), "-")
		f.SetCellValue(sheet, fmt.Sprintf("I%d", sumRow), totSakit)
		f.SetCellValue(sheet, fmt.Sprintf("J%d", sumRow), totCuti)
		f.SetCellValue(sheet, fmt.Sprintf("K%d", sumRow), totAlpha)
		f.SetCellValue(sheet, fmt.Sprintf("L%d", sumRow), fmt.Sprintf("%.1f", totLembur))
		f.SetCellValue(sheet, fmt.Sprintf("M%d", sumRow), "-")
		f.SetCellValue(sheet, fmt.Sprintf("N%d", sumRow), "-")

		for c := 0; c < totalCols; c++ {
			cell := fmt.Sprintf("%s%d", colName(c), sumRow)
			f.SetCellStyle(sheet, cell, cell, totStyle)
		}
		f.SetRowHeight(sheet, sumRow, 22)
	}

	// ── Freeze header rows ─────────────────────────────────────────────────────
	f.SetPanes(sheet, &excelize.Panes{
		Freeze:      true,
		Split:       false,
		XSplit:      0,
		YSplit:      5,
		TopLeftCell: "A6",
		ActivePane:  "bottomLeft",
	})

	// ── Print setup ────────────────────────────────────────────────────────────
	landscape := "landscape"
	f.SetPageLayout(sheet, &excelize.PageLayoutOptions{Orientation: &landscape})

	fileName := fmt.Sprintf("Rekap_Kehadiran_%s_sd_%s.xlsx",
		startDate.Format("02Jan2006"),
		endDate.Format("02Jan2006"),
	)

	return f, fileName, nil
}

// GenerateAttendanceLogReport generates a styled Excel for raw attendance logs
func GenerateAttendanceLogReport(data []dto.AttendanceLogResponse) (*excelize.File, string, error) {
	f := excelize.NewFile()

	sheet := "Detail Absensi"
	index, _ := f.NewSheet(sheet)
	f.SetActiveSheet(index)
	f.DeleteSheet("Sheet1")

	lastCol := "I"

	// Title
	titleStyle, _ := styleTitleMain(f)
	subStyle, _ := styleTitleSub(f)
	f.MergeCell(sheet, "A1", lastCol+"1")
	f.SetCellValue(sheet, "A1", "PT SALUT GAJAH MADA - DETAIL LOG ABSENSI")
	f.SetCellStyle(sheet, "A1", lastCol+"1", titleStyle)
	f.SetRowHeight(sheet, 1, 28)

	f.MergeCell(sheet, "A2", lastCol+"2")
	f.SetCellValue(sheet, "A2", fmt.Sprintf("Dicetak: %s", time.Now().Format("02 January 2006 15:04")))
	f.SetCellStyle(sheet, "A2", lastCol+"2", subStyle)
	f.SetRowHeight(sheet, 2, 18)
	f.SetRowHeight(sheet, 3, 6)

	// Headers
	headers := []struct {
		label string
		width float64
	}{
		{"Tanggal & Waktu", 22},
		{"NIK", 14},
		{"Nama Karyawan", 26},
		{"Cabang", 18},
		{"Tipe", 12},
		{"Status", 14},
		{"Manual?", 10},
		{"Catatan", 28},
		{"Lokasi (Lat, Long)", 24},
	}

	hStyle, _ := styleHeader(f)
	for i, h := range headers {
		cell := colName(i) + "4"
		f.SetCellValue(sheet, cell, h.label)
		f.SetCellStyle(sheet, cell, cell, hStyle)
		f.SetColWidth(sheet, colName(i), colName(i), h.width)
	}
	f.SetRowHeight(sheet, 4, 30)

	evenStyle, _ := styleDataEven(f)
	oddStyle, _ := styleDataOdd(f)
	evenCtr, _ := styleDataCenter(f, false)
	oddCtr, _ := styleDataCenter(f, true)

	for i, row := range data {
		rowIdx := i + 5
		isOdd := i%2 == 1
		base := evenStyle
		ctr := evenCtr
		if isOdd {
			base = oddStyle
			ctr = oddCtr
		}

		f.SetCellValue(sheet, fmt.Sprintf("A%d", rowIdx), row.CreatedAt.Format("02/01/2006 15:04:05"))
		f.SetCellValue(sheet, fmt.Sprintf("B%d", rowIdx), row.UserNIK)
		f.SetCellValue(sheet, fmt.Sprintf("C%d", rowIdx), row.UserName)
		f.SetCellValue(sheet, fmt.Sprintf("D%d", rowIdx), row.BranchName)

		tipe := "Check In"
		if row.Type == "check_out" {
			tipe = "Check Out"
		}
		f.SetCellValue(sheet, fmt.Sprintf("E%d", rowIdx), tipe)

		status := "Tepat Waktu"
		if row.Status == "late" {
			status = "Terlambat"
		}
		f.SetCellValue(sheet, fmt.Sprintf("F%d", rowIdx), status)

		isManual := "Tidak"
		if row.IsManualEntry {
			isManual = "Ya"
		}
		f.SetCellValue(sheet, fmt.Sprintf("G%d", rowIdx), isManual)

		notes := ""
		if row.Notes != nil {
			notes = *row.Notes
		} else if row.ManualReason != nil {
			notes = *row.ManualReason
		}
		f.SetCellValue(sheet, fmt.Sprintf("H%d", rowIdx), notes)
		f.SetCellValue(sheet, fmt.Sprintf("I%d", rowIdx), fmt.Sprintf("%.6f, %.6f", row.Latitude, row.Longitude))

		f.SetCellStyle(sheet, fmt.Sprintf("A%d", rowIdx), fmt.Sprintf("D%d", rowIdx), base)
		f.SetCellStyle(sheet, fmt.Sprintf("E%d", rowIdx), fmt.Sprintf("I%d", rowIdx), ctr)
		f.SetCellStyle(sheet, fmt.Sprintf("H%d", rowIdx), fmt.Sprintf("H%d", rowIdx), base)
		f.SetRowHeight(sheet, rowIdx, 17)
	}

	f.SetPanes(sheet, &excelize.Panes{Freeze: true, YSplit: 4, TopLeftCell: "A5", ActivePane: "bottomLeft"})
	ls := "landscape"
	f.SetPageLayout(sheet, &excelize.PageLayoutOptions{Orientation: &ls})

	fileName := fmt.Sprintf("Detail_Absensi_%s.xlsx", time.Now().Format("02Jan2006_150405"))
	return f, fileName, nil
}
