package service

import (
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/sgm/hadir-backend/internal/dto"
	"github.com/sgm/hadir-backend/internal/model"
	"github.com/sgm/hadir-backend/pkg/fcm"
	"gorm.io/gorm"
)

type OvertimeService struct {
	db *gorm.DB
}

func NewOvertimeService(db *gorm.DB) *OvertimeService {
	return &OvertimeService{db: db}
}

func (s *OvertimeService) CreateRequest(userID uuid.UUID, req dto.OvertimeRequestCreate) (*model.OvertimeRequest, error) {
	var user model.User
	if err := s.db.First(&user, "id = ?", userID).Error; err != nil {
		return nil, errors.New("user not found")
	}

	date, err := time.Parse("2006-01-02", req.Date)
	if err != nil {
		return nil, errors.New("invalid date format")
	}

	jakartaLoc, _ := time.LoadLocation("Asia/Jakarta")
	layout := "2006-01-02 15:04"
	estimatedStart, err := time.ParseInLocation(layout, req.Date+" "+req.EstimatedStart, jakartaLoc)
	if err != nil {
		return nil, errors.New("invalid estimated_start format, expected HH:MM")
	}
	estimatedEnd, err := time.ParseInLocation(layout, req.Date+" "+req.EstimatedEnd, jakartaLoc)
	if err != nil {
		return nil, errors.New("invalid estimated_end format, expected HH:MM")
	}

	if user.BranchID == nil {
		return nil, errors.New("user must belong to a branch")
	}

	overtime := model.OvertimeRequest{
		UserID:         userID,
		BranchID:       *user.BranchID,
		Date:           date,
		EstimatedStart: estimatedStart,
		EstimatedEnd:   estimatedEnd,
		Reason:         &req.Reason,
		Status:         model.OvertimeStatusPending,
	}

	if err := s.db.Create(&overtime).Error; err != nil {
		return nil, err
	}

	go NotifyAdmins(s.db, "admin_request_notif_enabled",
		"Pengajuan Lembur Baru",
		user.Name+" mengajukan lembur.",
		map[string]string{"type": "overtime_request", "overtime_id": overtime.ID.String(), "user_name": user.Name},
	)

	return &overtime, nil
}

func (s *OvertimeService) GetAllRequests(filter dto.OvertimeFilter) ([]dto.OvertimeResponse, error) {
	query := s.db.Model(&model.OvertimeRequest{}).
		Preload("User").
		Preload("Branch").
		Preload("Approver")

	if filter.UserID != "" {
		query = query.Where("user_id = ?", filter.UserID)
	}
	if filter.BranchID != "" {
		query = query.Where("branch_id = ?", filter.BranchID)
	}
	if filter.Status != "" {
		query = query.Where("status = ?", filter.Status)
	}
	if filter.StartDate != "" {
		query = query.Where("date >= ?", filter.StartDate)
	}
	if filter.EndDate != "" {
		query = query.Where("date <= ?", filter.EndDate)
	}

	var overtimes []model.OvertimeRequest
	if err := query.Order("created_at desc").Find(&overtimes).Error; err != nil {
		return nil, err
	}

	var responses []dto.OvertimeResponse
	for _, o := range overtimes {
		var actualStart, actualEnd *string
		if o.ActualStart != nil {
			s := o.ActualStart.Format(time.RFC3339)
			actualStart = &s
		}
		if o.ActualEnd != nil {
			e := o.ActualEnd.Format(time.RFC3339)
			actualEnd = &e
		}

		var approverName *string
		if o.Approver != nil {
			approverName = &o.Approver.Name
		}

		responses = append(responses, dto.OvertimeResponse{
			ID:             o.ID.String(),
			UserID:         o.UserID.String(),
			UserName:       o.User.Name,
			BranchID:       o.BranchID.String(),
			BranchName:     o.Branch.Name,
			Date:           o.Date.Format("2006-01-02"),
			EstimatedStart: o.EstimatedStart.Format("15:04"),
			EstimatedEnd:   o.EstimatedEnd.Format("15:04"),
			ActualStart:    actualStart,
			ActualEnd:      actualEnd,
			ActualHours:    o.ActualHours,
			Reason:         o.Reason,
			Status:         string(o.Status),
			ApproverID:     func() *string { if o.ApproverID != nil { s := o.ApproverID.String(); return &s }; return nil }(),
			ApproverName:   approverName,
			ApproverNote:   o.ApproverNote,
			ApprovedAt:     o.ApprovedAt,
			CreatedAt:      o.CreatedAt,
		})
	}

	return responses, nil
}

func (s *OvertimeService) UpdateStatus(id uuid.UUID, approverID uuid.UUID, req dto.OvertimeRequestUpdateStatus) error {
	var overtime model.OvertimeRequest
	if err := s.db.First(&overtime, "id = ?", id).Error; err != nil {
		return errors.New("overtime request not found")
	}

	if overtime.Status != model.OvertimeStatusPending {
		return errors.New("only pending requests can be approved or rejected")
	}

	now := time.Now()
	updates := map[string]interface{}{
		"status":        req.Status,
		"approver_id":   approverID,
		"approver_note": req.ApproverNote,
		"approved_at":   now,
	}

	if err := s.db.Model(&overtime).Updates(updates).Error; err != nil {
		return err
	}

	go s.sendOvertimeStatusNotification(&overtime, req.Status)
	return nil
}

func (s *OvertimeService) sendOvertimeStatusNotification(overtime *model.OvertimeRequest, status string) {
	var user model.User
	if err := s.db.Select("fcm_token, name").Where("id = ?", overtime.UserID).First(&user).Error; err != nil {
		return
	}
	if user.FCMToken == nil || *user.FCMToken == "" {
		return
	}

	var title, body string
	switch status {
	case "approved":
		title = "Pengajuan Lembur Disetujui ✅"
		body = fmt.Sprintf("Pengajuan lembur tanggal %s DISETUJUI ✅", overtime.Date.Format("02 Jan 2006"))
	case "rejected":
		title = "Pengajuan Lembur Ditolak ❌"
		body = fmt.Sprintf("Pengajuan lembur tanggal %s DITOLAK ❌", overtime.Date.Format("02 Jan 2006"))
	default:
		return
	}

	if err := fcm.SendToToken(*user.FCMToken, title, body, map[string]string{
		"type":       "overtime_status",
		"overtime_id": overtime.ID.String(),
		"status":     status,
	}); err != nil {
		log.Printf("[FCM] Overtime status notification error: %v", err)
	}
}

func (s *OvertimeService) UpdateOvertimeRequest(id uuid.UUID, userID uuid.UUID, req dto.OvertimeRequestCreate) error {
	var overtime model.OvertimeRequest
	if err := s.db.First(&overtime, "id = ?", id).Error; err != nil {
		return errors.New("pengajuan lembur tidak ditemukan")
	}
	if overtime.UserID != userID {
		return errors.New("tidak diizinkan mengubah pengajuan milik orang lain")
	}
	if overtime.Status != model.OvertimeStatusPending {
		return errors.New("hanya pengajuan berstatus 'menunggu' yang dapat diubah")
	}

	date, err := time.Parse("2006-01-02", req.Date)
	if err != nil {
		return errors.New("format tanggal tidak valid")
	}

	jakartaLoc, _ := time.LoadLocation("Asia/Jakarta")
	layout := "2006-01-02 15:04"
	estimatedStart, err := time.ParseInLocation(layout, req.Date+" "+req.EstimatedStart, jakartaLoc)
	if err != nil {
		return errors.New("format jam mulai tidak valid (HH:MM)")
	}
	estimatedEnd, err := time.ParseInLocation(layout, req.Date+" "+req.EstimatedEnd, jakartaLoc)
	if err != nil {
		return errors.New("format jam selesai tidak valid (HH:MM)")
	}

	reason := req.Reason
	return s.db.Model(&overtime).Updates(map[string]interface{}{
		"date":            date,
		"estimated_start": estimatedStart,
		"estimated_end":   estimatedEnd,
		"reason":          &reason,
	}).Error
}
