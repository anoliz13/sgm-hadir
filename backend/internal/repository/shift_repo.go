package repository

import (
	"time"

	"github.com/google/uuid"
	"github.com/sgm/hadir-backend/internal/model"
	"gorm.io/gorm"
)

type ShiftRepository struct {
	db *gorm.DB
}

func NewShiftRepository(db *gorm.DB) *ShiftRepository {
	return &ShiftRepository{db: db}
}

func (r *ShiftRepository) FindAll() ([]model.Shift, error) {
	var shifts []model.Shift
	err := r.db.Order("name ASC").Find(&shifts).Error
	return shifts, err
}

func (r *ShiftRepository) FindByID(id uuid.UUID) (*model.Shift, error) {
	var shift model.Shift
	err := r.db.First(&shift, "id = ?", id).Error
	return &shift, err
}

func (r *ShiftRepository) Create(shift *model.Shift) error {
	return r.db.Create(shift).Error
}

func (r *ShiftRepository) Update(shift *model.Shift) error {
	return r.db.Save(shift).Error
}

func (r *ShiftRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&model.Shift{}, "id = ?", id).Error
}

func (r *ShiftRepository) AssignShift(userID, shiftID uuid.UUID, effectiveDate time.Time) error {
	es := &model.EmployeeShift{
		UserID:        userID,
		ShiftID:       shiftID,
		EffectiveDate: effectiveDate,
	}
	return r.db.Create(es).Error
}

// GetActiveShift returns the most recent shift assignment for a user on or before the given date.
func (r *ShiftRepository) GetActiveShift(userID uuid.UUID, date time.Time) (*model.Shift, error) {
	var es model.EmployeeShift
	err := r.db.Preload("Shift").
		Where("user_id = ? AND effective_date <= ?", userID, date).
		Order("effective_date DESC").
		First(&es).Error
	if err != nil {
		return nil, err
	}
	return es.Shift, nil
}

func (r *ShiftRepository) GetEmployeeShifts(userID uuid.UUID) ([]model.EmployeeShift, error) {
	var shifts []model.EmployeeShift
	err := r.db.Preload("Shift").
		Where("user_id = ?", userID).
		Order("effective_date DESC").
		Find(&shifts).Error
	return shifts, err
}
