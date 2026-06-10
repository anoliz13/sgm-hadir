package model

import (
	"time"

	"github.com/google/uuid"
)

type AttendanceType string
type AttendanceStatus string

const (
	TypeCheckIn    AttendanceType = "check_in"
	TypeCheckOut   AttendanceType = "check_out"
	TypeOvertimeIn AttendanceType = "overtime_in"
	TypeOvertimeOut AttendanceType = "overtime_out"
	TypeVisitIn    AttendanceType = "visit_in"
	TypeVisitOut   AttendanceType = "visit_out"

	StatusOnTime    AttendanceStatus = "on_time"
	StatusLate      AttendanceStatus = "late"
	StatusEarly     AttendanceStatus = "early_leave"
	StatusHalfDay   AttendanceStatus = "half_day"
)

type Attendance struct {
	ID                 uuid.UUID        `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	UserID             uuid.UUID        `gorm:"type:uuid;not null"`
	User               *User            `gorm:"foreignKey:UserID"`
	BranchID           uuid.UUID        `gorm:"type:uuid;not null"`
	Branch             *Branch          `gorm:"foreignKey:BranchID"`
	Type               AttendanceType   `gorm:"type:varchar(50);not null"`
	Status             *AttendanceStatus `gorm:"type:varchar(50)"`
	Latitude           float64          `gorm:"type:double precision;not null"`
	Longitude          float64          `gorm:"type:double precision;not null"`
	GpsAccuracy        *float64         `gorm:"type:float"`
	DistanceFromBranch *float64         `gorm:"type:float"`
	SelfieURL          *string          `gorm:"type:varchar(255)"`
	Notes              *string          `gorm:"type:text"`
	IsManualEntry      bool             `gorm:"default:false"`
	ManualReason       *string          `gorm:"type:text"`
	CreatedAt          time.Time        `gorm:"type:timestamptz;default:current_timestamp;index"`
}
