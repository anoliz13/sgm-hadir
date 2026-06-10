package service

import (
	"errors"

	"github.com/google/uuid"
	"github.com/sgm/hadir-backend/internal/dto"
	"github.com/sgm/hadir-backend/internal/model"
	"github.com/sgm/hadir-backend/internal/repository"
)

type BranchService struct {
	repo *repository.BranchRepository
}

func NewBranchService(repo *repository.BranchRepository) *BranchService {
	return &BranchService{repo: repo}
}

func (s *BranchService) CreateBranch(req *dto.CreateBranchRequest) (*model.Branch, error) {
	branch := &model.Branch{
		Name:                 req.Name,
		Latitude:             req.Latitude,
		Longitude:            req.Longitude,
		WorkStart:            req.WorkStart,
		WorkEnd:              req.WorkEnd,
		RequireSelfie:        req.RequireSelfie,
	}

	if req.Address != "" {
		branch.Address = &req.Address
	}
	if req.RadiusMeters > 0 {
		branch.RadiusMeters = req.RadiusMeters
	}
	if req.LateToleranceMinutes > 0 {
		branch.LateToleranceMinutes = req.LateToleranceMinutes
	}
	if len(req.WorkDays) > 0 {
		branch.WorkDays = req.WorkDays
	}
	if req.Timezone != "" {
		branch.Timezone = req.Timezone
	}

	err := s.repo.Create(branch)
	return branch, err
}

func (s *BranchService) GetAllBranches() ([]model.Branch, error) {
	return s.repo.FindAll()
}

func (s *BranchService) GetBranchByID(id uuid.UUID) (*model.Branch, error) {
	return s.repo.FindByID(id)
}

func (s *BranchService) UpdateBranch(id uuid.UUID, req *dto.UpdateBranchRequest) (*model.Branch, error) {
	branch, err := s.repo.FindByID(id)
	if err != nil {
		return nil, errors.New("branch not found")
	}

	if req.Name != nil {
		branch.Name = *req.Name
	}
	if req.Address != nil {
		branch.Address = req.Address
	}
	if req.Latitude != nil {
		branch.Latitude = *req.Latitude
	}
	if req.Longitude != nil {
		branch.Longitude = *req.Longitude
	}
	if req.RadiusMeters != nil {
		branch.RadiusMeters = *req.RadiusMeters
	}
	if req.WorkStart != nil {
		branch.WorkStart = *req.WorkStart
	}
	if req.WorkEnd != nil {
		branch.WorkEnd = *req.WorkEnd
	}
	if req.LateToleranceMinutes != nil {
		branch.LateToleranceMinutes = *req.LateToleranceMinutes
	}
	if req.WorkDays != nil {
		branch.WorkDays = req.WorkDays
	}
	if req.RequireSelfie != nil {
		branch.RequireSelfie = *req.RequireSelfie
	}
	if req.Timezone != nil {
		branch.Timezone = *req.Timezone
	}
	if req.IsActive != nil {
		branch.IsActive = *req.IsActive
	}

	err = s.repo.Update(branch)
	return branch, err
}

func (s *BranchService) DeleteBranch(id uuid.UUID) error {
	return s.repo.Delete(id)
}
