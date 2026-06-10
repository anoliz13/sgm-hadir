package repository

import (
	"time"

	"github.com/sgm/hadir-backend/internal/model"
	"gorm.io/gorm"
)

type HolidayRepository struct {
	db *gorm.DB
}

func NewHolidayRepository(db *gorm.DB) *HolidayRepository {
	return &HolidayRepository{db: db}
}

func (r *HolidayRepository) Create(h *model.Holiday) error {
	return r.db.Create(h).Error
}

func (r *HolidayRepository) FindAll() ([]model.Holiday, error) {
	var holidays []model.Holiday
	err := r.db.Order("date ASC").Find(&holidays).Error
	return holidays, err
}

func (r *HolidayRepository) FindByYear(year int) ([]model.Holiday, error) {
	var holidays []model.Holiday
	start := time.Date(year, 1, 1, 0, 0, 0, 0, time.UTC)
	end := time.Date(year+1, 1, 1, 0, 0, 0, 0, time.UTC)
	err := r.db.Where("date >= ? AND date < ?", start, end).Order("date ASC").Find(&holidays).Error
	return holidays, err
}

func (r *HolidayRepository) IsHoliday(date time.Time) (bool, error) {
	var count int64
	dateStr := date.Format("2006-01-02")
	err := r.db.Model(&model.Holiday{}).Where("DATE(date) = ?", dateStr).Count(&count).Error
	return count > 0, err
}

func (r *HolidayRepository) UpsertBatch(holidays []model.Holiday) error {
	for _, h := range holidays {
		var existing model.Holiday
		result := r.db.Where("DATE(date) = DATE(?)", h.Date).First(&existing)
		if result.Error == gorm.ErrRecordNotFound {
			if err := r.db.Create(&h).Error; err != nil {
				return err
			}
		}
		// skip if already exists
	}
	return nil
}

func (r *HolidayRepository) Delete(id string) error {
	return r.db.Where("id = ?", id).Delete(&model.Holiday{}).Error
}
