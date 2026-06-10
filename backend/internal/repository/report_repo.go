package repository

import (
	"encoding/json"
	"strings"
	"time"

	"github.com/sgm/hadir-backend/internal/dto"
	"gorm.io/gorm"
)

type ReportRepository struct {
	db *gorm.DB
}

func NewReportRepository(db *gorm.DB) *ReportRepository {
	return &ReportRepository{db: db}
}

// GetAttendanceSummary returns one row per employee per assigned shift.
// Attendance is matched to each shift by comparing the day-of-week of the
// attendance record against the shift's work_days JSONB array.
func (r *ReportRepository) GetAttendanceSummary(filter dto.ReportFilter) ([]dto.AttendanceSummary, error) {
	type rawSummary struct {
		UserID        string
		NIK           string
		Name          string
		Division      string
		BranchName    string
		ShiftName     string
		ShiftWorkDays string
		TotalHadir    int
		TotalTerlambat int
		JamLembur     float64
	}

	startStr := filter.StartDate.Format("2006-01-02")
	endStr := filter.EndDate.Format("2006-01-02")

	rawQuery := `
		SELECT
			users.id::text                                              AS user_id,
			users.nik,
			users.name,
			COALESCE(users.division, '-')                              AS division,
			COALESCE(branches.name, '-')                               AS branch_name,
			COALESCE(s.name, '-')                                      AS shift_name,
			COALESCE(s.work_days::text, '[]')                         AS shift_work_days,
			COUNT(CASE WHEN a.type = 'check_in' THEN 1 END)           AS total_hadir,
			COUNT(CASE WHEN a.type = 'check_in' AND a.status = 'late' THEN 1 END) AS total_terlambat,
			COALESCE(SUM(CASE WHEN ot.status = 'approved' AND ot.actual_hours IS NOT NULL
				THEN ot.actual_hours END), 0)                          AS jam_lembur
		FROM users
		LEFT JOIN branches ON users.branch_id = branches.id
		LEFT JOIN LATERAL (
			SELECT DISTINCT shift_id
			FROM employee_shifts
			WHERE user_id = users.id AND effective_date <= ?
		) assigned ON TRUE
		LEFT JOIN shifts s ON s.id = assigned.shift_id AND s.is_active = true
		LEFT JOIN attendances a ON a.user_id = users.id
			AND DATE(a.created_at) >= ? AND DATE(a.created_at) <= ?
			AND (s.work_days IS NULL
				OR s.work_days @> to_jsonb(trim(lower(to_char(a.created_at, 'Day')))))
		LEFT JOIN overtime_requests ot ON ot.user_id = users.id
			AND DATE(ot.date) >= ? AND DATE(ot.date) <= ?
			AND (s.work_days IS NULL
				OR s.work_days @> to_jsonb(trim(lower(to_char(ot.date, 'Day')))))
		WHERE users.is_active = true
			AND users.role NOT IN ('super_admin', 'supervisor', 'kepala_salut', 'manajer_salut')
	`
	args := []interface{}{endStr, startStr, endStr, startStr, endStr}

	if filter.BranchID != "" {
		rawQuery += " AND users.branch_id = ?"
		args = append(args, filter.BranchID)
	}
	if filter.Division != "" {
		rawQuery += " AND users.division ILIKE ?"
		args = append(args, "%"+filter.Division+"%")
	}
	if filter.UserID != "" {
		rawQuery += " AND users.id::text = ?"
		args = append(args, filter.UserID)
	}
	if filter.Search != "" {
		rawQuery += " AND (users.name ILIKE ? OR users.nik ILIKE ?)"
		args = append(args, "%"+filter.Search+"%", "%"+filter.Search+"%")
	}

	rawQuery += `
		GROUP BY users.id, users.nik, users.name, users.division, branches.name,
		         s.id, s.name, s.work_days
		ORDER BY users.name, s.name
	`

	var raws []rawSummary
	if err := r.db.Raw(rawQuery, args...).Scan(&raws).Error; err != nil {
		return nil, err
	}

	var summary []dto.AttendanceSummary
	for _, raw := range raws {
		var workDays []string
		if raw.ShiftWorkDays != "" && raw.ShiftWorkDays != "[]" {
			_ = json.Unmarshal([]byte(raw.ShiftWorkDays), &workDays)
		}
		workingDays := r.countWorkingDaysForShift(filter.StartDate, filter.EndDate, workDays)

		alpha := workingDays - raw.TotalHadir
		if alpha < 0 {
			alpha = 0
		}
		pct := 0.0
		if workingDays > 0 {
			pct = float64(raw.TotalHadir) / float64(workingDays) * 100
		}
		summary = append(summary, dto.AttendanceSummary{
			UserID:           raw.UserID,
			NIK:              raw.NIK,
			Name:             raw.Name,
			Division:         raw.Division,
			BranchName:       raw.BranchName,
			ShiftName:        raw.ShiftName,
			TotalHadir:       raw.TotalHadir,
			TotalTerlambat:   raw.TotalTerlambat,
			JamLembur:        raw.JamLembur,
			Sakit:            0,
			Cuti:             0,
			Alpha:            alpha,
			HariKerjaEfektif: workingDays,
			PersentaseHadir:  pct,
		})
	}
	return summary, nil
}

func (r *ReportRepository) GetLeaveReport(start, end time.Time, branchID string) ([]dto.LeaveReportRow, error) {
	type raw struct {
		UserID     string
		NIK        string
		Name       string
		BranchName string
		LeaveType  string
		StartDate  time.Time
		EndDate    time.Time
		TotalDays  int
		Reason     string
		Status     string
	}

	q := r.db.Table("leave_requests lr").
		Select(`
			u.id as user_id, u.nik, u.name,
			COALESCE(b.name, '-') as branch_name,
			COALESCE(lt.name, '-') as leave_type,
			lr.start_date, lr.end_date,
			(lr.end_date::date - lr.start_date::date + 1) as total_days,
			COALESCE(lr.reason, '') as reason,
			lr.status
		`).
		Joins("JOIN users u ON u.id = lr.user_id").
		Joins("LEFT JOIN branches b ON b.id = u.branch_id").
		Joins("LEFT JOIN leave_types lt ON lt.id = lr.leave_type_id").
		Where("lr.start_date <= ? AND lr.end_date >= ?", end, start).
		Order("lr.start_date DESC")

	if branchID != "" {
		q = q.Where("u.branch_id = ?", branchID)
	}

	var raws []raw
	if err := q.Scan(&raws).Error; err != nil {
		return nil, err
	}

	var result []dto.LeaveReportRow
	for _, r := range raws {
		result = append(result, dto.LeaveReportRow{
			UserID:     r.UserID,
			NIK:        r.NIK,
			Name:       r.Name,
			BranchName: r.BranchName,
			LeaveType:  r.LeaveType,
			StartDate:  r.StartDate.Format("2006-01-02"),
			EndDate:    r.EndDate.Format("2006-01-02"),
			TotalDays:  r.TotalDays,
			Reason:     r.Reason,
			Status:     r.Status,
		})
	}
	return result, nil
}

func (r *ReportRepository) GetOvertimeReport(start, end time.Time, branchID string) ([]dto.OvertimeReportRow, error) {
	type raw struct {
		UserID      string
		NIK         string
		Name        string
		BranchName  string
		Date        time.Time
		EstHours    float64
		ActualHours *float64
		Reason      string
		Status      string
	}

	q := r.db.Table("overtime_requests ot").
		Select(`
			u.id as user_id, u.nik, u.name,
			COALESCE(b.name, '-') as branch_name,
			ot.date,
			COALESCE(EXTRACT(EPOCH FROM (ot.estimated_end::time - ot.estimated_start::time)) / 3600, 0) as est_hours,
			COALESCE(ot.actual_hours, 0) as actual_hours,
			COALESCE(ot.reason, '') as reason,
			ot.status
		`).
		Joins("JOIN users u ON u.id = ot.user_id").
		Joins("LEFT JOIN branches b ON b.id = u.branch_id").
		Where("DATE(ot.date) >= ? AND DATE(ot.date) <= ?", start.Format("2006-01-02"), end.Format("2006-01-02")).
		Order("ot.date DESC")

	if branchID != "" {
		q = q.Where("u.branch_id = ?", branchID)
	}

	var raws []raw
	if err := q.Scan(&raws).Error; err != nil {
		return nil, err
	}

	var result []dto.OvertimeReportRow
	for _, r := range raws {
		actualH := 0.0
		if r.ActualHours != nil {
			actualH = *r.ActualHours
		}
		result = append(result, dto.OvertimeReportRow{
			UserID:      r.UserID,
			NIK:         r.NIK,
			Name:        r.Name,
			BranchName:  r.BranchName,
			Date:        r.Date.Format("2006-01-02"),
			EstHours:    r.EstHours,
			ActualHours: actualH,
			Reason:      r.Reason,
			Status:      r.Status,
		})
	}
	return result, nil
}

// countWorkingDaysForShift counts days in [start,end] that match the shift's work_days
// and are not public holidays. When workDays is empty, defaults to Mon–Fri.
func (r *ReportRepository) countWorkingDaysForShift(start, end time.Time, workDays []string) int {
	daySet := make(map[string]bool)
	if len(workDays) == 0 {
		for _, d := range []string{"monday", "tuesday", "wednesday", "thursday", "friday"} {
			daySet[d] = true
		}
	} else {
		for _, d := range workDays {
			daySet[strings.ToLower(d)] = true
		}
	}

	type holidayDate struct{ Date time.Time }
	var holidays []holidayDate
	r.db.Table("holidays").
		Select("date").
		Where("date >= ? AND date <= ?", start.Format("2006-01-02"), end.Format("2006-01-02")).
		Scan(&holidays)

	holidayMap := make(map[string]bool)
	for _, h := range holidays {
		holidayMap[h.Date.Format("2006-01-02")] = true
	}

	count := 0
	for d := start; !d.After(end); d = d.AddDate(0, 0, 1) {
		if daySet[strings.ToLower(d.Weekday().String())] && !holidayMap[d.Format("2006-01-02")] {
			count++
		}
	}
	return count
}
