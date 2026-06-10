package model

import (
	"time"

	"github.com/google/uuid"
)

// EmployeeShift assigns a shift to a user starting from a given date.
// The latest record for a user (by effective_date) is their active shift.
type EmployeeShift struct {
	ID            uuid.UUID  `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	UserID        uuid.UUID  `gorm:"type:uuid;not null;index" json:"user_id"`
	User          *User      `gorm:"foreignKey:UserID" json:"user,omitempty"`
	ShiftID       uuid.UUID  `gorm:"type:uuid;not null" json:"shift_id"`
	Shift         *Shift     `gorm:"foreignKey:ShiftID" json:"shift,omitempty"`
	EffectiveDate time.Time  `gorm:"type:date;not null" json:"effective_date"`
	CreatedAt     time.Time  `gorm:"type:timestamptz;default:current_timestamp" json:"created_at"`
}
