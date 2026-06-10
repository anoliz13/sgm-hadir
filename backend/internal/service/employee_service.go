package service

import (
	"errors"

	"github.com/google/uuid"
	"github.com/sgm/hadir-backend/internal/dto"
	"github.com/sgm/hadir-backend/internal/model"
	"github.com/sgm/hadir-backend/internal/repository"
	"github.com/sgm/hadir-backend/pkg/hash"
)

type EmployeeService struct {
	repo *repository.UserRepository
}

func NewEmployeeService(repo *repository.UserRepository) *EmployeeService {
	return &EmployeeService{repo: repo}
}

func (s *EmployeeService) CreateEmployee(req *dto.CreateEmployeeRequest) (*model.User, error) {
	// Check if NIK exists
	existing, _ := s.repo.FindByNIK(req.NIK)
	if existing != nil {
		return nil, errors.New("NIK already registered")
	}

	hashedPassword, err := hash.HashPassword(req.Password)
	if err != nil {
		return nil, errors.New("failed to hash password")
	}

	branchID, err := uuid.Parse(req.BranchID)
	if err != nil {
		return nil, errors.New("invalid branch ID")
	}

	user := &model.User{
		NIK:          req.NIK,
		Name:         req.Name,
		PasswordHash: hashedPassword,
		Role:         model.UserRole(req.Role),
		BranchID:     &branchID,
	}

	if req.Email != "" {
		user.Email = &req.Email
	}
	if req.Position != "" {
		user.Position = &req.Position
	}
	if req.Division != "" {
		user.Division = &req.Division
	}
	if req.Phone != "" {
		user.Phone = &req.Phone
	}
	if req.AnnualLeaveQuota > 0 {
		user.AnnualLeaveQuota = req.AnnualLeaveQuota
	} else {
		user.AnnualLeaveQuota = 12
	}

	err = s.repo.Create(user)
	return user, err
}

func (s *EmployeeService) GetAllEmployees() ([]model.User, error) {
	return s.repo.FindAll()
}

func (s *EmployeeService) GetEmployeeByID(id uuid.UUID) (*model.User, error) {
	return s.repo.FindByID(id)
}

func (s *EmployeeService) UpdateEmployee(id uuid.UUID, req *dto.UpdateEmployeeRequest) (*model.User, error) {
	user, err := s.repo.FindByID(id)
	if err != nil {
		return nil, errors.New("employee not found")
	}

	if req.Name != nil {
		user.Name = *req.Name
	}
	if req.Email != nil {
		user.Email = req.Email
	}
	if req.Password != nil && *req.Password != "" {
		hashed, err := hash.HashPassword(*req.Password)
		if err == nil {
			user.PasswordHash = hashed
		}
	}
	if req.Role != nil {
		user.Role = model.UserRole(*req.Role)
	}
	if req.BranchID != nil {
		branchID, err := uuid.Parse(*req.BranchID)
		if err == nil {
			user.BranchID = &branchID
		}
	}
	if req.Position != nil {
		user.Position = req.Position
	}
	if req.Division != nil {
		user.Division = req.Division
	}
	if req.Phone != nil {
		user.Phone = req.Phone
	}
	if req.AnnualLeaveQuota != nil {
		user.AnnualLeaveQuota = *req.AnnualLeaveQuota
	}
	if req.IsActive != nil {
		user.IsActive = *req.IsActive
	}

	err = s.repo.Update(user)
	return user, err
}
