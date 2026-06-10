package service

import (
	"github.com/sgm/hadir-backend/internal/model"
	"github.com/sgm/hadir-backend/internal/repository"
)

type RolePermissionService struct {
	repo *repository.RolePermissionRepository
}

func NewRolePermissionService(repo *repository.RolePermissionRepository) *RolePermissionService {
	return &RolePermissionService{repo: repo}
}

func (s *RolePermissionService) GetAll() ([]model.RolePermission, error) {
	return s.repo.FindAll()
}

func (s *RolePermissionService) GetByRole(roleName string) (*model.RolePermission, error) {
	return s.repo.FindByRole(roleName)
}

func (s *RolePermissionService) Update(roleName, displayName string, permissions []string) (*model.RolePermission, error) {
	rp := &model.RolePermission{
		RoleName:    roleName,
		DisplayName: displayName,
		Permissions: model.StringSlice(permissions),
	}
	if err := s.repo.Upsert(rp); err != nil {
		return nil, err
	}
	return s.repo.FindByRole(roleName)
}
