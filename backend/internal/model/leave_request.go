package model

import (
	"time"

	"github.com/google/uuid"
)

type LeaveStatus string

const (
	LeaveStatusPending  LeaveStatus = "pending"
	LeaveStatusApproved LeaveStatus = "approved"
	LeaveStatusRejected LeaveStatus = "rejected"
)

type LeaveType struct {
	ID               uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	Name             string    `gorm:"type:varchar(255);not null"`
	RequiresDocument bool      `gorm:"default:false"`
	DeductsQuota     bool      `gorm:"default:true"`
	MaxDaysPerYear   *int      `gorm:"type:int"`
	CreatedAt        time.Time `gorm:"type:timestamptz;default:current_timestamp"`
}

type LeaveRequest struct {
	ID            uuid.UUID   `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	UserID        uuid.UUID   `gorm:"type:uuid;not null"`
	User          *User       `gorm:"foreignKey:UserID"`
	LeaveTypeID   uuid.UUID   `gorm:"type:uuid;not null"`
	LeaveType     *LeaveType  `gorm:"foreignKey:LeaveTypeID"`
	StartDate     time.Time   `gorm:"type:date;not null"`
	EndDate       time.Time   `gorm:"type:date;not null"`
	TotalDays     int         `gorm:"not null"`
	Reason        *string     `gorm:"type:text"`
	AttachmentURL *string     `gorm:"type:varchar(255)"`
	Status        LeaveStatus `gorm:"type:varchar(50);default:'pending'"`
	ApproverID    *uuid.UUID  `gorm:"type:uuid"`
	Approver      *User       `gorm:"foreignKey:ApproverID"`
	ApproverNote  *string     `gorm:"type:text"`
	ApprovedAt    *time.Time  `gorm:"type:timestamptz"`
	CreatedAt     time.Time   `gorm:"type:timestamptz;default:current_timestamp"`
	UpdatedAt     time.Time   `gorm:"type:timestamptz;default:current_timestamp"`
}
