package service

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/sgm/hadir-backend/internal/model"
	"github.com/sgm/hadir-backend/internal/repository"
)

type HolidayService struct {
	repo *repository.HolidayRepository
}

func NewHolidayService(repo *repository.HolidayRepository) *HolidayService {
	return &HolidayService{repo: repo}
}

func (s *HolidayService) GetAll() ([]model.Holiday, error) {
	return s.repo.FindAll()
}

func (s *HolidayService) GetByYear(year int) ([]model.Holiday, error) {
	return s.repo.FindByYear(year)
}

func (s *HolidayService) Create(name string, date time.Time, holidayType model.HolidayType) (*model.Holiday, error) {
	h := &model.Holiday{
		Name: name,
		Date: date,
		Type: holidayType,
	}
	return h, s.repo.Create(h)
}

func (s *HolidayService) Delete(id string) error {
	return s.repo.Delete(id)
}

// IsWorkingDay returns true if date is not a weekend and not in the holiday table.
func (s *HolidayService) IsWorkingDay(date time.Time) (bool, error) {
	if date.Weekday() == time.Saturday || date.Weekday() == time.Sunday {
		return false, nil
	}
	isHoliday, err := s.repo.IsHoliday(date)
	if err != nil {
		return false, err
	}
	return !isHoliday, nil
}

// apiHoliday represents a single entry from the public holiday API.
type apiHoliday struct {
	HolidayDate string `json:"holiday_date"`
	HolidayName string `json:"holiday_name"`
	IsNational  bool   `json:"is_national_holiday"`
}

// ImportNationalHolidays fetches and stores national holidays for a given year.
func (s *HolidayService) ImportNationalHolidays(year int) (int, error) {
	url := fmt.Sprintf("https://api-harilibur.vercel.app/api?year=%d", year)

	resp, err := http.Get(url)
	if err != nil {
		return 0, fmt.Errorf("failed to fetch holidays API: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return 0, fmt.Errorf("holidays API returned status %d", resp.StatusCode)
	}

	var apiData []apiHoliday
	if err := json.NewDecoder(resp.Body).Decode(&apiData); err != nil {
		return 0, fmt.Errorf("failed to decode holidays API response: %w", err)
	}

	holidays := make([]model.Holiday, 0, len(apiData))
	for _, item := range apiData {
		if !item.IsNational {
			continue
		}
		date, err := time.Parse("2006-01-02", item.HolidayDate)
		if err != nil {
			continue
		}
		holidays = append(holidays, model.Holiday{
			Name: item.HolidayName,
			Date: date,
			Type: model.HolidayTypeNational,
		})
	}

	if err := s.repo.UpsertBatch(holidays); err != nil {
		return 0, err
	}
	return len(holidays), nil
}
