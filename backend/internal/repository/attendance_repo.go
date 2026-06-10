package repository

import (
	"time"

	"github.com/google/uuid"
	"github.com/sgm/hadir-backend/internal/dto"
	"github.com/sgm/hadir-backend/internal/model"
	"gorm.io/gorm"
)

type AttendanceRepository struct {
	db *gorm.DB
}

func NewAttendanceRepository(db *gorm.DB) *AttendanceRepository {
	return &AttendanceRepository{db: db}
}

func (r *AttendanceRepository) Create(attendance *model.Attendance) error {
	return r.db.Create(attendance).Error
}

func (r *AttendanceRepository) FindTodayCheckIn(userID uuid.UUID) (*model.Attendance, error) {
	var attendance model.Attendance
	
	today := time.Now().Truncate(24 * time.Hour)
	tomorrow := today.Add(24 * time.Hour)

	err := r.db.Where("user_id = ? AND type = ? AND created_at >= ? AND created_at < ?", 
		userID, model.TypeCheckIn, today, tomorrow).First(&attendance).Error
	
	if err != nil {
		return nil, err
	}
	return &attendance, nil
}

func (r *AttendanceRepository) FindTodayCheckOut(userID uuid.UUID) (*model.Attendance, error) {
	var attendance model.Attendance

	today := time.Now().Truncate(24 * time.Hour)
	tomorrow := today.Add(24 * time.Hour)

	err := r.db.Where("user_id = ? AND type = ? AND created_at >= ? AND created_at < ?",
		userID, model.TypeCheckOut, today, tomorrow).First(&attendance).Error

	if err != nil {
		return nil, err
	}
	return &attendance, nil
}

func (r *AttendanceRepository) FindTodayVisitIn(userID uuid.UUID) (*model.Attendance, error) {
	var attendance model.Attendance

	today := time.Now().Truncate(24 * time.Hour)
	tomorrow := today.Add(24 * time.Hour)

	err := r.db.Where("user_id = ? AND type = ? AND created_at >= ? AND created_at < ?",
		userID, model.TypeVisitIn, today, tomorrow).Order("created_at DESC").First(&attendance).Error

	if err != nil {
		return nil, err
	}
	return &attendance, nil
}

func (r *AttendanceRepository) FindTodayVisitOut(userID uuid.UUID) (*model.Attendance, error) {
	var attendance model.Attendance

	today := time.Now().Truncate(24 * time.Hour)
	tomorrow := today.Add(24 * time.Hour)

	err := r.db.Where("user_id = ? AND type = ? AND created_at >= ? AND created_at < ?",
		userID, model.TypeVisitOut, today, tomorrow).Order("created_at DESC").First(&attendance).Error

	if err != nil {
		return nil, err
	}
	return &attendance, nil
}

func (r *AttendanceRepository) FindTodayAll() ([]model.Attendance, error) {
	var attendances []model.Attendance

	today := time.Now().Truncate(24 * time.Hour)
	tomorrow := today.Add(24 * time.Hour)

	err := r.db.Preload("User").
		Where("created_at >= ? AND created_at < ?", today, tomorrow).
		Order("created_at DESC").
		Find(&attendances).Error

	if err != nil {
		return nil, err
	}
	return attendances, nil
}

func (r *AttendanceRepository) FindByID(id uuid.UUID) (*model.Attendance, error) {
	var attendance model.Attendance
	err := r.db.First(&attendance, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &attendance, nil
}

func (r *AttendanceRepository) Update(attendance *model.Attendance) error {
	return r.db.Save(attendance).Error
}

func (r *AttendanceRepository) GetAttendanceLeaderboard(sortBy string) ([]dto.AttendanceLeaderboardEntry, error) {
	var results []dto.AttendanceLeaderboardEntry
	orderClause := "on_time_count DESC"
	if sortBy == "late" {
		orderClause = "late_count DESC"
	}
	err := r.db.Model(&model.Attendance{}).
		Select(`u.name, u.id as user_id,
			COUNT(*) FILTER (WHERE attendances.type = 'check_in' AND attendances.status = 'on_time') as on_time_count,
			COUNT(*) FILTER (WHERE attendances.type = 'check_in' AND attendances.status = 'late') as late_count`).
		Joins("JOIN users u ON u.id = attendances.user_id").
		Where("attendances.created_at >= date_trunc('year', CURRENT_DATE)").
		Group("u.id, u.name").
		Order(orderClause).
		Limit(10).
		Scan(&results).Error
	return results, err
}

func (r *AttendanceRepository) FindAllFiltered(filter dto.AttendanceFilter) ([]model.Attendance, error) {
	var attendances []model.Attendance
	query := r.db.Preload("User").Preload("Branch")

	if filter.StartDate != "" {
		query = query.Where("created_at >= ?", filter.StartDate)
	}
	if filter.EndDate != "" {
		// Add 1 day to end date to include the whole day
		query = query.Where("created_at <= ?::date + interval '1 day'", filter.EndDate)
	}
	if filter.BranchID != "" {
		query = query.Where("branch_id = ?", filter.BranchID)
	}
	if filter.Type != "" {
		if filter.Type == "visit" {
			query = query.Where("type IN ?", []string{string(model.TypeVisitIn), string(model.TypeVisitOut)})
		} else if filter.Type == "attendance" {
			query = query.Where("type IN ?", []string{string(model.TypeCheckIn), string(model.TypeCheckOut)})
		} else {
			query = query.Where("type = ?", filter.Type)
		}
	}
	if filter.Search != "" {
		search := "%" + filter.Search + "%"
		query = query.Joins("User").Where("User.name ILIKE ? OR User.nik ILIKE ?", search, search)
	}
	if filter.UserID != nil {
		query = query.Where("user_id = ?", *filter.UserID)
	}

	err := query.Order("attendances.created_at DESC").Limit(200).Find(&attendances).Error
	return attendances, err
}
