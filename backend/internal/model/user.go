package model

import (
	"time"

	"github.com/google/uuid"
)

type UserRole string

const (
	RoleSuperAdmin   UserRole = "super_admin"
	RoleSupervisor   UserRole = "supervisor"
	RoleEmployee     UserRole = "employee"
	RoleKepalaSalut  UserRole = "kepala_salut"
	RoleManajerSalut UserRole = "manajer_salut"
)

type User struct {
	ID               uuid.UUID  `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	NIK              string     `gorm:"type:varchar(20);unique;not null" json:"nik"`
	Name             string     `gorm:"type:varchar(255);not null" json:"name"`
	PasswordHash     string     `gorm:"type:varchar(255);not null" json:"-"`
	Role             UserRole   `gorm:"type:varchar(50);default:'employee';not null" json:"role"`
	PhotoURL         *string    `gorm:"type:varchar(255)" json:"photo_url"`
	Position         *string    `gorm:"type:varchar(255)" json:"position"`
	Division         *string    `gorm:"type:varchar(255)" json:"division"`
	BranchID         *uuid.UUID `gorm:"type:uuid" json:"branch_id"`
	Branch           *Branch    `gorm:"foreignKey:BranchID" json:"branch"`
	Phone            *string    `gorm:"type:varchar(50)" json:"phone"`
	Email            *string    `gorm:"type:varchar(255)" json:"email"`
	AnnualLeaveQuota int        `gorm:"default:12" json:"annual_leave_quota"`
	AnnualLeaveUsed  int        `gorm:"default:0" json:"annual_leave_used"`
	FCMToken         *string    `gorm:"type:varchar(512)" json:"fcm_token,omitempty"`
	IsActive         bool       `gorm:"default:true" json:"is_active"`
	JoinedAt         *time.Time `gorm:"type:date" json:"joined_at"`
	CreatedAt        time.Time  `gorm:"type:timestamptz;default:current_timestamp" json:"created_at"`
	UpdatedAt        time.Time  `gorm:"type:timestamptz;default:current_timestamp" json:"updated_at"`
}
