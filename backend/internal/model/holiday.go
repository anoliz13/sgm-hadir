package model

import (
	"time"

	"github.com/google/uuid"
)

type HolidayType string

const (
	HolidayTypeNational HolidayType = "national"
	HolidayTypeCompany  HolidayType = "company"
)

type Holiday struct {
	ID        uuid.UUID   `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	Name      string      `gorm:"type:varchar(255);not null" json:"name"`
	Date      time.Time   `gorm:"type:date;unique;not null" json:"date"`
	Type      HolidayType `gorm:"type:varchar(50);default:'national';not null" json:"type"`
	CreatedAt time.Time   `gorm:"type:timestamptz;default:current_timestamp" json:"created_at"`
}
