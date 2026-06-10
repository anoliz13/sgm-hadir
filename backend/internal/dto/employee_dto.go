package dto

import "github.com/google/uuid"

type CreateEmployeeRequest struct {
	NIK              string  `json:"nik" binding:"required"`
	Name             string  `json:"name" binding:"required"`
	Email            string  `json:"email" binding:"required,email"`
	Password         string  `json:"password" binding:"required,min=6"`
	Role             string  `json:"role" binding:"required"`
	BranchID         string  `json:"branch_id" binding:"required,uuid"`
	Position         string  `json:"position"`
	Division         string  `json:"division"`
	Phone            string  `json:"phone"`
	AnnualLeaveQuota int     `json:"annual_leave_quota"`
}

type UpdateEmployeeRequest struct {
	Name             *string `json:"name"`
	Email            *string `json:"email" binding:"omitempty,email"`
	Password         *string `json:"password" binding:"omitempty,min=6"`
	Role             *string `json:"role"`
	BranchID         *string `json:"branch_id" binding:"omitempty,uuid"`
	Position         *string `json:"position"`
	Division         *string `json:"division"`
	Phone            *string `json:"phone"`
	AnnualLeaveQuota *int    `json:"annual_leave_quota"`
	IsActive         *bool   `json:"is_active"`
}

type EmployeeResponse struct {
	ID               uuid.UUID `json:"id"`
	NIK              string    `json:"nik"`
	Name             string    `json:"name"`
	Email            *string   `json:"email"`
	Role             string    `json:"role"`
	BranchID         *uuid.UUID `json:"branch_id"`
	Position         *string   `json:"position"`
	Division         *string   `json:"division"`
	Phone            *string   `json:"phone"`
	PhotoURL         *string   `json:"photo_url"`
	AnnualLeaveQuota int       `json:"annual_leave_quota"`
	AnnualLeaveUsed  int       `json:"annual_leave_used"`
	IsActive         bool      `json:"is_active"`
}
