package dto

import "time"

type ReportFilter struct {
	StartDateStr string `form:"start_date" binding:"required"`
	EndDateStr   string `form:"end_date" binding:"required"`
	BranchID     string `form:"branch_id"`
	Division     string `form:"division"`
	UserID       string `form:"user_id"`
	Search       string `form:"search"`

	// Parsed values — populated by ParseDates()
	StartDate time.Time
	EndDate   time.Time
}

// ParseDates parses StartDateStr/EndDateStr (YYYY-MM-DD) into time.Time fields.
func (f *ReportFilter) ParseDates() error {
	var err error
	f.StartDate, err = time.ParseInLocation("2006-01-02", f.StartDateStr, time.Local)
	if err != nil {
		return err
	}
	f.EndDate, err = time.ParseInLocation("2006-01-02", f.EndDateStr, time.Local)
	return err
}

type LeaveReportRow struct {
	UserID     string `json:"user_id"`
	NIK        string `json:"nik"`
	Name       string `json:"name"`
	BranchName string `json:"branch_name"`
	LeaveType  string `json:"leave_type"`
	StartDate  string `json:"start_date"`
	EndDate    string `json:"end_date"`
	TotalDays  int    `json:"total_days"`
	Reason     string `json:"reason"`
	Status     string `json:"status"`
}

type OvertimeReportRow struct {
	UserID       string  `json:"user_id"`
	NIK          string  `json:"nik"`
	Name         string  `json:"name"`
	BranchName   string  `json:"branch_name"`
	Date         string  `json:"date"`
	EstHours     float64 `json:"est_hours"`
	ActualHours  float64 `json:"actual_hours"`
	Reason       string  `json:"reason"`
	Status       string  `json:"status"`
}

type AttendanceSummary struct {
	UserID           string  `json:"user_id"`
	NIK              string  `json:"nik"`
	Name             string  `json:"name"`
	Division         string  `json:"division"`
	BranchName       string  `json:"branch_name"`
	ShiftName        string  `json:"shift_name"`
	TotalHadir       int     `json:"total_hadir"`
	TotalTerlambat   int     `json:"total_terlambat"`
	LateMinutes      int     `json:"late_minutes"`
	Sakit            int     `json:"sakit"`
	Cuti             int     `json:"cuti"`
	Alpha            int     `json:"alpha"`
	JamLembur        float64 `json:"jam_lembur"`
	HariKerjaEfektif int     `json:"hari_kerja_efektif"`
	PersentaseHadir  float64 `json:"persentase_hadir"`
}
