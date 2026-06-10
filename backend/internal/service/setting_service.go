package service

import (
	"github.com/sgm/hadir-backend/internal/model"
	"github.com/sgm/hadir-backend/internal/repository"
)

type SettingService struct {
	repo *repository.SettingRepository
}

func NewSettingService(repo *repository.SettingRepository) *SettingService {
	return &SettingService{repo: repo}
}

func (s *SettingService) GetAll() ([]model.AppSetting, error) {
	return s.repo.FindAll()
}

func (s *SettingService) GetByGroup(group string) ([]model.AppSetting, error) {
	return s.repo.FindByGroup(group)
}

func (s *SettingService) BulkUpdate(settings map[string]string) error {
	return s.repo.BulkSet(settings)
}
