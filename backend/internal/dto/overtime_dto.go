package dto

import "time"

type OvertimeRequestCreate struct {
	Date           string `json:"date" binding:"required"` // Format: YYYY-MM-DD
	EstimatedStart string `json:"estimated_start" binding:"required"` // Format: HH:MM
	EstimatedEnd   string `json:"estimated_end" binding:"required"` // Format: HH:MM
	Reason         string `json:"reason" binding:"required"`
}

type OvertimeRequestUpdateStatus struct {
	Status       string `json:"status" binding:"required,oneof=approved rejected"`
	ApproverNote string `json:"approver_note"`
}

type OvertimeFilter struct {
	UserID    string `form:"user_id"`
	BranchID  string `form:"branch_id"`
	Status    string `form:"status"`
	StartDate string `form:"start_date"`
	EndDate   string `form:"end_date"`
}

type OvertimeResponse struct {
	ID             string    `json:"id"`
	UserID         string    `json:"user_id"`
	UserName       string    `json:"user_name"`
	BranchID       string    `json:"branch_id"`
	BranchName     string    `json:"branch_name"`
	Date           string    `json:"date"`
	EstimatedStart string    `json:"estimated_start"`
	EstimatedEnd   string    `json:"estimated_end"`
	ActualStart    *string   `json:"actual_start,omitempty"`
	ActualEnd      *string   `json:"actual_end,omitempty"`
	ActualHours    *float64  `json:"actual_hours,omitempty"`
	Reason         *string   `json:"reason,omitempty"`
	Status         string    `json:"status"`
	ApproverID     *string   `json:"approver_id,omitempty"`
	ApproverName   *string   `json:"approver_name,omitempty"`
	ApproverNote   *string   `json:"approver_note,omitempty"`
	ApprovedAt     *time.Time `json:"approved_at,omitempty"`
	CreatedAt      time.Time  `json:"created_at"`
}
