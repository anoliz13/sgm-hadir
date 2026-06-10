package service

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type DashboardService struct {
	db *gorm.DB
}

func NewDashboardService(db *gorm.DB) *DashboardService {
	return &DashboardService{db: db}
}

type DashboardSummary struct {
	TotalActiveEmployees int   `json:"total_active_employees"`
	TotalPresentToday    int   `json:"total_present_today"`
	TotalNotCheckedIn    int   `json:"total_not_checked_in"`
	TotalLeaveToday      int64 `json:"total_leave_today"`
	TotalLateToday       int   `json:"total_late_today"`
}

func (s *DashboardService) GetSummary(branchID *uuid.UUID) (*DashboardSummary, error) {
	today := time.Now().Format("2006-01-02")

	// Total active employees
	var totalActive int64
	q := s.db.Table("users").Where("is_active = true AND role = 'employee'")
	if branchID != nil {
		q = q.Where("branch_id = ?", branchID)
	}
	q.Count(&totalActive)

	// Total checked in today
	var presentIDs []string
	cq := s.db.Table("attendances").
		Select("DISTINCT user_id::text").
		Where("type = 'check_in' AND DATE(created_at) = ?", today)
	if branchID != nil {
		cq = cq.Where("branch_id = ?", branchID)
	}
	cq.Pluck("user_id", &presentIDs)
	totalPresent := len(presentIDs)

	// Total late today
	var totalLate int64
	lq := s.db.Table("attendances").
		Where("type = 'check_in' AND status = 'late' AND DATE(created_at) = ?", today)
	if branchID != nil {
		lq = lq.Where("branch_id = ?", branchID)
	}
	lq.Count(&totalLate)

	// Total active leave today
	var totalLeave int64
	leaveQ := s.db.Table("leave_requests").
		Where("status = 'approved' AND start_date <= ? AND end_date >= ?", today, today)
	if branchID != nil {
		leaveQ = leaveQ.Joins("JOIN users ON users.id = leave_requests.user_id").
			Where("users.branch_id = ?", branchID)
	}
	leaveQ.Count(&totalLeave)

	notCheckedIn := int(totalActive) - totalPresent
	if notCheckedIn < 0 {
		notCheckedIn = 0
	}

	return &DashboardSummary{
		TotalActiveEmployees: int(totalActive),
		TotalPresentToday:    totalPresent,
		TotalNotCheckedIn:    notCheckedIn,
		TotalLeaveToday:      totalLeave,
		TotalLateToday:       int(totalLate),
	}, nil
}

type TrendDay struct {
	Date      string `json:"date"`
	Hadir     int    `json:"hadir"`
	Terlambat int    `json:"terlambat"`
	Izin      int    `json:"izin"`
}

func (s *DashboardService) GetAttendanceTrend(days int, branchID *uuid.UUID) ([]TrendDay, error) {
	result := make([]TrendDay, 0, days)
	now := time.Now()

	for i := days - 1; i >= 0; i-- {
		date := now.AddDate(0, 0, -i)
		dateStr := date.Format("2006-01-02")

		// Skip weekends for cleaner data
		if date.Weekday() == time.Saturday || date.Weekday() == time.Sunday {
			continue
		}

		var hadir int64
		cq := s.db.Table("attendances").
			Where("type = 'check_in' AND DATE(created_at) = ?", dateStr)
		if branchID != nil {
			cq = cq.Where("branch_id = ?", branchID)
		}
		cq.Count(&hadir)

		var terlambat int64
		lq := s.db.Table("attendances").
			Where("type = 'check_in' AND status = 'late' AND DATE(created_at) = ?", dateStr)
		if branchID != nil {
			lq = lq.Where("branch_id = ?", branchID)
		}
		lq.Count(&terlambat)

		var izin int64
		iQ := s.db.Table("leave_requests").
			Where("status = 'approved' AND start_date <= ? AND end_date >= ?", dateStr, dateStr)
		if branchID != nil {
			iQ = iQ.Joins("JOIN users ON users.id = leave_requests.user_id").
				Where("users.branch_id = ?", branchID)
		}
		iQ.Count(&izin)

		result = append(result, TrendDay{
			Date:      dateStr,
			Hadir:     int(hadir),
			Terlambat: int(terlambat),
			Izin:      int(izin),
		})
	}
	return result, nil
}

type BranchComparison struct {
	BranchName   string  `json:"branch_name"`
	TotalPresent int     `json:"total_present"`
	TotalLate    int     `json:"total_late"`
	OnTimeRate   float64 `json:"on_time_rate"`
}

func (s *DashboardService) GetBranchComparison() ([]BranchComparison, error) {
	today := time.Now().Format("2006-01-02")

	type row struct {
		BranchName   string
		TotalPresent int64
		TotalLate    int64
	}

	var rows []row
	s.db.Raw(`
		SELECT b.name AS branch_name,
		       COUNT(a.id) AS total_present,
		       COUNT(CASE WHEN a.status = 'late' THEN 1 END) AS total_late
		FROM branches b
		LEFT JOIN attendances a ON a.branch_id = b.id
		    AND a.type = 'check_in'
		    AND DATE(a.created_at) = ?
		GROUP BY b.name
		ORDER BY total_present DESC
	`, today).Scan(&rows)

	result := make([]BranchComparison, 0, len(rows))
	for _, r := range rows {
		onTime := 0.0
		if r.TotalPresent > 0 {
			onTime = float64(r.TotalPresent-r.TotalLate) / float64(r.TotalPresent) * 100
		}
		result = append(result, BranchComparison{
			BranchName:   r.BranchName,
			TotalPresent: int(r.TotalPresent),
			TotalLate:    int(r.TotalLate),
			OnTimeRate:   onTime,
		})
	}
	return result, nil
}
