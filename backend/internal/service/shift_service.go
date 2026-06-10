package service

import (
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/sgm/hadir-backend/internal/model"
	"github.com/sgm/hadir-backend/internal/repository"
)

type ShiftService struct {
	repo *repository.ShiftRepository
}

func NewShiftService(repo *repository.ShiftRepository) *ShiftService {
	return &ShiftService{repo: repo}
}

func (s *ShiftService) GetAll() ([]model.Shift, error) {
	return s.repo.FindAll()
}

var defaultWorkDays = model.StringSlice{"monday", "tuesday", "wednesday", "thursday", "friday"}

func (s *ShiftService) Create(name, startTime, endTime string, workDays []string) (*model.Shift, error) {
	if name == "" || startTime == "" || endTime == "" {
		return nil, errors.New("name, start_time and end_time are required")
	}
	days := model.StringSlice(workDays)
	if len(days) == 0 {
		days = defaultWorkDays
	}
	shift := &model.Shift{
		Name:      name,
		StartTime: startTime,
		EndTime:   endTime,
		WorkDays:  days,
		IsActive:  true,
	}
	return shift, s.repo.Create(shift)
}

func (s *ShiftService) Update(id uuid.UUID, name, startTime, endTime string, isActive bool, workDays []string) (*model.Shift, error) {
	shift, err := s.repo.FindByID(id)
	if err != nil {
		return nil, errors.New("shift not found")
	}
	if name != "" {
		shift.Name = name
	}
	if startTime != "" {
		shift.StartTime = startTime
	}
	if endTime != "" {
		shift.EndTime = endTime
	}
	if len(workDays) > 0 {
		shift.WorkDays = model.StringSlice(workDays)
	}
	shift.IsActive = isActive
	return shift, s.repo.Update(shift)
}

func (s *ShiftService) Delete(id uuid.UUID) error {
	return s.repo.Delete(id)
}

func (s *ShiftService) AssignShift(userID, shiftID uuid.UUID, effectiveDateStr string) error {
	date, err := time.Parse("2006-01-02", effectiveDateStr)
	if err != nil {
		return errors.New("invalid effective_date format, use YYYY-MM-DD")
	}
	return s.repo.AssignShift(userID, shiftID, date)
}

func (s *ShiftService) GetActiveShift(userID uuid.UUID) (*model.Shift, error) {
	return s.repo.GetActiveShift(userID, time.Now())
}

func (s *ShiftService) GetEmployeeShifts(userID uuid.UUID) ([]model.EmployeeShift, error) {
	return s.repo.GetEmployeeShifts(userID)
}
