package dto

import (
	"time"

	"github.com/google/uuid"
)

type LeaveRequestCreate struct {
	LeaveTypeID   uuid.UUID `json:"leave_type_id" binding:"required"`
	StartDate     string    `json:"start_date" binding:"required"`
	EndDate       string    `json:"end_date" binding:"required"`
	TotalDays     int       `json:"total_days" binding:"required"`
	Reason        *string   `json:"reason"`
	AttachmentURL *string   `json:"attachment_url"`
}

type LeaveRequestUpdateStatus struct {
	Status       string  `json:"status" binding:"required"`
	ApproverNote *string `json:"approver_note"`
}

type LeaveFilter struct {
	Status    string `form:"status"`
	StartDate string `form:"start_date"`
	EndDate   string `form:"end_date"`
	Search    string `form:"search"`
	UserID    string `form:"user_id"`
	BranchID  string `form:"branch_id"` // for RBAC filtering
}

type LeaveRequestResponse struct {
	ID            uuid.UUID  `json:"id"`
	UserID        uuid.UUID  `json:"user_id"`
	UserNIK       string     `json:"user_nik"`
	UserName      string     `json:"user_name"`
	LeaveTypeID   uuid.UUID  `json:"leave_type_id"`
	LeaveTypeName string     `json:"leave_type_name"`
	StartDate     time.Time  `json:"start_date"`
	EndDate       time.Time  `json:"end_date"`
	TotalDays     int        `json:"total_days"`
	Reason        *string    `json:"reason"`
	AttachmentURL *string    `json:"attachment_url"`
	Status        string     `json:"status"`
	ApproverID    *uuid.UUID `json:"approver_id"`
	ApproverName  *string    `json:"approver_name"`
	ApproverNote  *string    `json:"approver_note"`
	ApprovedAt    *time.Time `json:"approved_at"`
	CreatedAt     time.Time  `json:"created_at"`
}
