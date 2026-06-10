package service

import (
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/sgm/hadir-backend/internal/dto"
	"github.com/sgm/hadir-backend/internal/model"
	"github.com/sgm/hadir-backend/internal/repository"
	"github.com/sgm/hadir-backend/pkg/excel"
	"github.com/xuri/excelize/v2"
	"gorm.io/gorm"
)

type AttendanceService struct {
	repo       *repository.AttendanceRepository
	userRepo   *repository.UserRepository
	branchRepo *repository.BranchRepository
	shiftRepo  *repository.ShiftRepository
	db         *gorm.DB
}

func NewAttendanceService(
	repo *repository.AttendanceRepository,
	userRepo *repository.UserRepository,
	branchRepo *repository.BranchRepository,
) *AttendanceService {
	return &AttendanceService{
		repo:       repo,
		userRepo:   userRepo,
		branchRepo: branchRepo,
	}
}

func (s *AttendanceService) WithShiftRepo(shiftRepo *repository.ShiftRepository) *AttendanceService {
	s.shiftRepo = shiftRepo
	return s
}

func (s *AttendanceService) WithDB(db *gorm.DB) *AttendanceService {
	s.db = db
	return s
}

func (s *AttendanceService) CheckIn(userID uuid.UUID, req *dto.CheckInRequest) (*model.Attendance, error) {
	// Check if user already checked in today (only for regular check in)
	if req.Type != "visit_in" {
		existing, _ := s.repo.FindTodayCheckIn(userID)
		if existing != nil {
			return nil, errors.New("already checked in today")
		}
	}

	// Get user to find their assigned branch
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, errors.New("user not found")
	}

	if user.BranchID == nil {
		return nil, errors.New("user is not assigned to any branch")
	}

	// Get branch config
	branch, err := s.branchRepo.FindByID(*user.BranchID)
	if err != nil {
		return nil, errors.New("branch not found")
	}

	// Validate GPS Distance
	distance := float64(0)
	isVisit := req.Type == "visit_in"
	if !isVisit {
		var isWithin bool
		isWithin, distance = IsWithinRadius(req.Latitude, req.Longitude, branch.Latitude, branch.Longitude, branch.RadiusMeters)
		if !isWithin {
			return nil, errors.New("anda berada di luar jangkauan kantor")
		}
	} else {
		distance = -1 // Indicates visit outside
	}

	if branch.RequireSelfie && req.SelfieURL == "" {
		return nil, errors.New("foto selfie wajib diunggah")
	}

	// Determine status (on_time or late)
	// Use employee shift if available, otherwise fall back to branch work start
	workStartStr := branch.WorkStart
	if s.shiftRepo != nil {
		if shift, err := s.shiftRepo.GetActiveShift(userID, time.Now()); err == nil && shift != nil {
			workStartStr = shift.StartTime + ":00"
		}
	}
	workStartTime, _ := time.Parse("15:04:00", workStartStr)
	now := time.Now()
	nowTime := time.Date(0, 1, 1, now.Hour(), now.Minute(), now.Second(), 0, time.UTC)

	toleranceDuration := time.Duration(branch.LateToleranceMinutes) * time.Minute
	lateThreshold := workStartTime.Add(toleranceDuration)

	status := model.StatusOnTime
	if nowTime.After(lateThreshold) {
		status = model.StatusLate
	}

	attType := model.TypeCheckIn
	if req.Type == "visit_in" {
		attType = model.TypeVisitIn
	}

	var notes *string
	if req.Notes != "" {
		notes = &req.Notes
	}

	attendance := &model.Attendance{
		UserID:             userID,
		BranchID:           branch.ID,
		Type:               attType,
		Status:             &status,
		Latitude:           req.Latitude,
		Longitude:          req.Longitude,
		DistanceFromBranch: &distance,
		SelfieURL:          &req.SelfieURL,
		Notes:              notes,
	}

	err = s.repo.Create(attendance)
	if err != nil {
		return nil, err
	}

	if s.db != nil {
		go NotifyAdmins(s.db, "admin_checkin_notif_enabled",
			"Karyawan Absen Masuk",
			user.Name+" telah melakukan absen masuk.",
			map[string]string{"type": "admin_checkin", "attendance_id": attendance.ID.String(), "user_name": user.Name},
		)
	}

	return attendance, nil
}

func (s *AttendanceService) CheckOut(userID uuid.UUID, req *dto.CheckOutRequest) (*model.Attendance, error) {
	if req.Type != "visit_out" {
		// Must have checked in first
		checkIn, _ := s.repo.FindTodayCheckIn(userID)
		if checkIn == nil {
			return nil, errors.New("you must check-in first before check-out")
		}

		// Cannot checkout twice
		existing, _ := s.repo.FindTodayCheckOut(userID)
		if existing != nil {
			return nil, errors.New("already checked out today")
		}
	}

	user, _ := s.userRepo.FindByID(userID)
	branch, _ := s.branchRepo.FindByID(*user.BranchID)

	distance := float64(0)
	isVisit := req.Type == "visit_out"
	if !isVisit {
		var isWithin bool
		isWithin, distance = IsWithinRadius(req.Latitude, req.Longitude, branch.Latitude, branch.Longitude, branch.RadiusMeters)
		if !isWithin {
			return nil, errors.New("anda berada di luar jangkauan kantor")
		}
	} else {
		distance = -1
	}

	status := model.StatusOnTime // Usually checkout doesn't have late status, maybe early leave

	attType := model.TypeCheckOut
	if req.Type == "visit_out" {
		attType = model.TypeVisitOut
	}

	var notes *string
	if req.Notes != "" {
		notes = &req.Notes
	}

	attendance := &model.Attendance{
		UserID:             userID,
		BranchID:           branch.ID,
		Type:               attType,
		Status:             &status,
		Latitude:           req.Latitude,
		Longitude:          req.Longitude,
		DistanceFromBranch: &distance,
		Notes:              notes,
	}

	err := s.repo.Create(attendance)
	if err != nil {
		return nil, err
	}

	return attendance, nil
}

func (s *AttendanceService) GetTodayAttendances() ([]model.Attendance, error) {
	return s.repo.FindTodayAll()
}

func (s *AttendanceService) GetMyTodayCheckIn(userID uuid.UUID) (*model.Attendance, error) {
	return s.repo.FindTodayCheckIn(userID)
}

func (s *AttendanceService) GetMyTodayCheckOut(userID uuid.UUID) (*model.Attendance, error) {
	return s.repo.FindTodayCheckOut(userID)
}

func (s *AttendanceService) GetMyTodayVisitIn(userID uuid.UUID) (*model.Attendance, error) {
	return s.repo.FindTodayVisitIn(userID)
}

func (s *AttendanceService) GetMyTodayVisitOut(userID uuid.UUID) (*model.Attendance, error) {
	return s.repo.FindTodayVisitOut(userID)
}

func (s *AttendanceService) GetAllAttendances(filter dto.AttendanceFilter) ([]dto.AttendanceLogResponse, error) {
	attendances, err := s.repo.FindAllFiltered(filter)
	if err != nil {
		return nil, err
	}

	var response []dto.AttendanceLogResponse
	for _, a := range attendances {
		var branchName string
		if a.Branch != nil {
			branchName = a.Branch.Name
		}
		var userName, userNik string
		if a.User != nil {
			userName = a.User.Name
			userNik = a.User.NIK
		}
		
		statusStr := ""
		if a.Status != nil {
			statusStr = string(*a.Status)
		}

		response = append(response, dto.AttendanceLogResponse{
			ID:            a.ID,
			UserNIK:       userNik,
			UserName:      userName,
			BranchName:    branchName,
			Type:          string(a.Type),
			Status:        statusStr,
			CreatedAt:     a.CreatedAt,
			Notes:         a.Notes,
			IsManualEntry: a.IsManualEntry,
			ManualReason:  a.ManualReason,
			Latitude:      a.Latitude,
			Longitude:     a.Longitude,
			SelfieURL:     a.SelfieURL,
		})
	}
	return response, nil
}

func (s *AttendanceService) UpdateAttendance(id uuid.UUID, req dto.UpdateAttendanceRequest) error {
	attendance, err := s.repo.FindByID(id)
	if err != nil {
		return err
	}

	status := model.AttendanceStatus(req.Status)
	attendance.Status = &status
	attendance.Notes = req.Notes
	attendance.IsManualEntry = req.IsManualEntry
	attendance.ManualReason = req.ManualReason
	
	if req.CreatedAt != "" {
		t, err := time.Parse(time.RFC3339, req.CreatedAt)
		if err == nil {
			attendance.CreatedAt = t
		}
	}

	return s.repo.Update(attendance)
}

func (s *AttendanceService) GenerateExcelReport(data []dto.AttendanceLogResponse) (*excelize.File, string, error) {
	return excel.GenerateAttendanceLogReport(data)
}

func (s *AttendanceService) GetDashboardStats(userID uuid.UUID) (map[string]interface{}, error) {
	userIDStr := userID.String()
	attendances, err := s.repo.FindAllFiltered(dto.AttendanceFilter{
		UserID: &userIDStr,
	})
	if err != nil {
		return nil, err
	}

	hadir := 0
	terlambat := 0
	lembur := 0

	for _, a := range attendances {
		if a.Type == model.TypeCheckIn {
			if a.Status != nil && *a.Status == "on_time" {
				hadir++
			} else if a.Status != nil && *a.Status == "late" {
				terlambat++
			}
		} else if a.Type == model.TypeOvertimeIn {
			lembur++
		}
	}

	var izin int64 = 0 // Needs leaveRepo, hardcoded to 0 for now

	user, _ := s.userRepo.FindByID(userID)

	ontimeLeaderboard, _ := s.repo.GetAttendanceLeaderboard("ontime")
	lateLeaderboard, _ := s.repo.GetAttendanceLeaderboard("late")

	return map[string]interface{}{
		"hadir":               hadir,
		"terlambat":           terlambat,
		"izin":                izin,
		"lembur":              lembur,
		"leave_quota":         user.AnnualLeaveQuota,
		"leave_used":          user.AnnualLeaveUsed,
		"leaderboard_ontime":  ontimeLeaderboard,
		"leaderboard_late":    lateLeaderboard,
	}, nil
}
