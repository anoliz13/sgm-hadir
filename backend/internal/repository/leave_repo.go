package repository

import (
	"github.com/google/uuid"
	"github.com/sgm/hadir-backend/internal/dto"
	"github.com/sgm/hadir-backend/internal/model"
	"gorm.io/gorm"
)

type LeaveRepository struct {
	db *gorm.DB
}

func NewLeaveRepository(db *gorm.DB) *LeaveRepository {
	return &LeaveRepository{db: db}
}

func (r *LeaveRepository) Create(leave *model.LeaveRequest) error {
	return r.db.Create(leave).Error
}

func (r *LeaveRepository) FindByID(id uuid.UUID) (*model.LeaveRequest, error) {
	var leave model.LeaveRequest
	err := r.db.Preload("User").Preload("LeaveType").Preload("Approver").First(&leave, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &leave, nil
}

func (r *LeaveRepository) Update(leave *model.LeaveRequest) error {
	return r.db.Save(leave).Error
}

func (r *LeaveRepository) FindAllFiltered(filter dto.LeaveFilter) ([]model.LeaveRequest, error) {
	var leaves []model.LeaveRequest
	query := r.db.Preload("User").Preload("LeaveType").Preload("Approver")

	if filter.Status != "" {
		query = query.Where("status = ?", filter.Status)
	}
	if filter.UserID != "" {
		query = query.Where("user_id = ?", filter.UserID)
	}
	if filter.StartDate != "" {
		query = query.Where("start_date >= ?", filter.StartDate)
	}
	if filter.EndDate != "" {
		query = query.Where("start_date <= ?", filter.EndDate)
	}
	if filter.Search != "" {
		search := "%" + filter.Search + "%"
		query = query.Joins("JOIN users ON users.id = leave_requests.user_id").
			Where("users.name ILIKE ? OR users.nik ILIKE ?", search, search)
	}

	if filter.BranchID != "" {
		if filter.Search == "" {
			query = query.Joins("JOIN users ON users.id = leave_requests.user_id")
		}
		query = query.Where("users.branch_id = ?", filter.BranchID)
	}

	err := query.Order("leave_requests.created_at DESC").Find(&leaves).Error
	return leaves, err
}

func (r *LeaveRepository) SumApprovedLeaveDays(userID uuid.UUID, yearStart, yearEnd string) (int, error) {
	var total int
	err := r.db.Model(&model.LeaveRequest{}).
		Joins("JOIN leave_types ON leave_types.id = leave_requests.leave_type_id").
		Where("leave_requests.user_id = ? AND leave_requests.status = 'approved' AND leave_types.deducts_quota = true AND leave_requests.start_date >= ? AND leave_requests.start_date <= ?", userID, yearStart, yearEnd).
		Select("COALESCE(SUM(leave_requests.total_days), 0)").
		Scan(&total).Error
	return total, err
}

func (r *LeaveRepository) FindAllLeaveTypes() ([]model.LeaveType, error) {
	var types []model.LeaveType
	err := r.db.Find(&types).Error
	return types, err
}
