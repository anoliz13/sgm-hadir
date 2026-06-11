package service

import (
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/sgm/hadir-backend/internal/dto"
	"github.com/sgm/hadir-backend/internal/model"
	"github.com/sgm/hadir-backend/internal/repository"
	"github.com/sgm/hadir-backend/pkg/fcm"
	"gorm.io/gorm"
)

type LeaveService struct {
	leaveRepo *repository.LeaveRepository
	userRepo  *repository.UserRepository
	db        *gorm.DB
}

func NewLeaveService(leaveRepo *repository.LeaveRepository, userRepo *repository.UserRepository) *LeaveService {
	return &LeaveService{
		leaveRepo: leaveRepo,
		userRepo:  userRepo,
	}
}

func (s *LeaveService) WithDB(db *gorm.DB) *LeaveService {
	s.db = db
	return s
}

func (s *LeaveService) CreateLeaveRequest(userID uuid.UUID, req dto.LeaveRequestCreate) (*model.LeaveRequest, error) {
	startDate, err := time.Parse("2006-01-02", req.StartDate)
	if err != nil {
		return nil, errors.New("invalid start date format")
	}
	endDate, err := time.Parse("2006-01-02", req.EndDate)
	if err != nil {
		return nil, errors.New("invalid end date format")
	}

	leave := &model.LeaveRequest{
		UserID:        userID,
		LeaveTypeID:   req.LeaveTypeID,
		StartDate:     startDate,
		EndDate:       endDate,
		TotalDays:     req.TotalDays,
		Reason:        req.Reason,
		AttachmentURL: req.AttachmentURL,
		Status:        model.LeaveStatusPending,
	}

	if err := s.leaveRepo.Create(leave); err != nil {
		return nil, err
	}

	if s.db != nil {
		user, _ := s.userRepo.FindByID(userID)
		userName := user.Name
		go NotifyAdmins(s.db, "admin_request_notif_enabled",
			"Pengajuan Izin Baru",
			userName+" mengajukan izin.",
			map[string]string{"type": "leave_request", "leave_id": leave.ID.String(), "user_name": userName},
		)
	}

	return leave, nil
}

func (s *LeaveService) GetAllLeaveRequests(filter dto.LeaveFilter) ([]dto.LeaveRequestResponse, error) {
	leaves, err := s.leaveRepo.FindAllFiltered(filter)
	if err != nil {
		return nil, err
	}

	var res []dto.LeaveRequestResponse
	for _, l := range leaves {
		var userName, userNIK, leaveTypeName string
		if l.User != nil {
			userName = l.User.Name
			userNIK = l.User.NIK
		}
		if l.LeaveType != nil {
			leaveTypeName = l.LeaveType.Name
		}

		var approverName *string
		if l.Approver != nil {
			approverName = &l.Approver.Name
		}

		res = append(res, dto.LeaveRequestResponse{
			ID:            l.ID,
			UserID:        l.UserID,
			UserNIK:       userNIK,
			UserName:      userName,
			LeaveTypeID:   l.LeaveTypeID,
			LeaveTypeName: leaveTypeName,
			StartDate:     l.StartDate,
			EndDate:       l.EndDate,
			TotalDays:     l.TotalDays,
			Reason:        l.Reason,
			AttachmentURL: l.AttachmentURL,
			Status:        string(l.Status),
			ApproverID:    l.ApproverID,
			ApproverName:  approverName,
			ApproverNote:  l.ApproverNote,
			ApprovedAt:    l.ApprovedAt,
			CreatedAt:     l.CreatedAt,
		})
	}
	return res, nil
}

func (s *LeaveService) UpdateLeaveStatus(leaveID uuid.UUID, approverID uuid.UUID, req dto.LeaveRequestUpdateStatus) error {
	approver, err := s.userRepo.FindByID(approverID)
	if err != nil {
		return errors.New("approver not found")
	}

	// Verify approver role: super_admin, kepala_salut, manajer_salut
	if approver.Role != model.RoleSuperAdmin && approver.Role != model.RoleKepalaSalut && approver.Role != model.RoleManajerSalut {
		return errors.New("unauthorized: you do not have permission to approve/reject leave requests")
	}

	leave, err := s.leaveRepo.FindByID(leaveID)
	if err != nil {
		return errors.New("leave request not found")
	}

	if leave.Status != model.LeaveStatusPending {
		return errors.New("leave request is already " + string(leave.Status))
	}

	status := model.LeaveStatus(req.Status)
	if status != model.LeaveStatusApproved && status != model.LeaveStatusRejected {
		return errors.New("invalid status, must be approved or rejected")
	}

	now := time.Now()
	leave.Status = status
	leave.ApproverID = &approverID
	leave.ApproverNote = req.ApproverNote
	leave.ApprovedAt = &now

	if err := s.leaveRepo.Update(leave); err != nil {
		return err
	}

	// Send FCM notification to the requesting employee
	go s.sendLeaveStatusNotification(leave)

	return nil
}

func (s *LeaveService) sendLeaveStatusNotification(leave *model.LeaveRequest) {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("[PANIC] sendLeaveStatusNotification recovered: %v", r)
		}
	}()
	employee, err := s.userRepo.FindByID(leave.UserID)
	if err != nil || employee.FCMToken == nil || *employee.FCMToken == "" {
		return
	}

	leaveTypeName := "Izin"
	if leave.LeaveType != nil {
		leaveTypeName = leave.LeaveType.Name
	}

	var title, body string
	switch leave.Status {
	case model.LeaveStatusApproved:
		title = "Pengajuan Disetujui ✅"
		body = fmt.Sprintf("Pengajuan %s kamu telah DISETUJUI ✅", leaveTypeName)
	case model.LeaveStatusRejected:
		title = "Pengajuan Ditolak ❌"
		body = fmt.Sprintf("Pengajuan %s kamu DITOLAK ❌. Hubungi atasan untuk info lebih lanjut.", leaveTypeName)
	default:
		return
	}

	if err := fcm.SendToToken(*employee.FCMToken, title, body, map[string]string{
		"type":     "leave_status",
		"leave_id": leave.ID.String(),
		"status":   string(leave.Status),
	}); err != nil {
		log.Printf("[FCM] Leave status notification error: %v", err)
	}
}

func (s *LeaveService) UpdateLeaveRequest(leaveID uuid.UUID, userID uuid.UUID, req dto.LeaveRequestCreate) error {
	leave, err := s.leaveRepo.FindByID(leaveID)
	if err != nil {
		return errors.New("pengajuan tidak ditemukan")
	}
	if leave.UserID != userID {
		return errors.New("tidak diizinkan mengubah pengajuan milik orang lain")
	}
	if leave.Status != model.LeaveStatusPending {
		return errors.New("hanya pengajuan berstatus 'menunggu' yang dapat diubah")
	}

	startDate, err := time.Parse("2006-01-02", req.StartDate)
	if err != nil {
		return errors.New("format tanggal mulai tidak valid")
	}
	endDate, err := time.Parse("2006-01-02", req.EndDate)
	if err != nil {
		return errors.New("format tanggal selesai tidak valid")
	}

	leave.LeaveTypeID = req.LeaveTypeID
	leave.StartDate = startDate
	leave.EndDate = endDate
	leave.TotalDays = req.TotalDays
	leave.Reason = req.Reason
	if req.AttachmentURL != nil && *req.AttachmentURL != "" {
		leave.AttachmentURL = req.AttachmentURL
	}

	return s.leaveRepo.Update(leave)
}

func (s *LeaveService) GetMyLeaveQuota(userID uuid.UUID) (map[string]interface{}, error) {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, errors.New("user not found")
	}

	currentYear := time.Now().Year()
	yearStart := fmt.Sprintf("%d-01-01", currentYear)
	yearEnd := fmt.Sprintf("%d-12-31", currentYear)

	usedDays, err := s.leaveRepo.SumApprovedLeaveDays(userID, yearStart, yearEnd)
	if err != nil {
		usedDays = 0
	}

	annualQuota := user.AnnualLeaveQuota
	remaining := annualQuota - usedDays
	if remaining < 0 {
		remaining = 0
	}

	return map[string]interface{}{
		"annual_quota":   annualQuota,
		"used_days":      usedDays,
		"remaining_days": remaining,
		"year":           currentYear,
	}, nil
}

func (s *LeaveService) GetAllLeaveTypes() ([]model.LeaveType, error) {
	return s.leaveRepo.FindAllLeaveTypes()
}
