package model

import (
	"time"

	"github.com/google/uuid"
)

type OvertimeStatus string

const (
	OvertimeStatusPending   OvertimeStatus = "pending"
	OvertimeStatusApproved  OvertimeStatus = "approved"
	OvertimeStatusRejected  OvertimeStatus = "rejected"
	OvertimeStatusCompleted OvertimeStatus = "completed"
)

type OvertimeRequest struct {
	ID             uuid.UUID      `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	UserID         uuid.UUID      `gorm:"type:uuid;not null"`
	User           *User          `gorm:"foreignKey:UserID"`
	BranchID       uuid.UUID      `gorm:"type:uuid;not null"`
	Branch         *Branch        `gorm:"foreignKey:BranchID"`
	Date           time.Time      `gorm:"type:date;not null"`
	EstimatedStart time.Time      `gorm:"type:timestamptz;not null"`
	EstimatedEnd   time.Time      `gorm:"type:timestamptz;not null"`
	ActualStart    *time.Time     `gorm:"type:timestamptz"`
	ActualEnd      *time.Time     `gorm:"type:timestamptz"`
	ActualHours    *float64       `gorm:"type:float"`
	Reason         *string        `gorm:"type:text"`
	Status         OvertimeStatus `gorm:"type:varchar(50);default:'pending'"`
	ApproverID     *uuid.UUID     `gorm:"type:uuid"`
	Approver       *User          `gorm:"foreignKey:ApproverID"`
	ApproverNote   *string        `gorm:"type:text"`
	ApprovedAt     *time.Time     `gorm:"type:timestamptz"`
	CreatedAt      time.Time      `gorm:"type:timestamptz;default:current_timestamp"`
	UpdatedAt      time.Time      `gorm:"type:timestamptz;default:current_timestamp"`
}
