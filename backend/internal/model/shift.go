package model

import (
	"time"

	"github.com/google/uuid"
)

type Shift struct {
	ID        uuid.UUID   `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	Name      string      `gorm:"type:varchar(100);not null"                     json:"name"`
	StartTime string      `gorm:"type:varchar(10);not null"                      json:"start_time"`
	EndTime   string      `gorm:"type:varchar(10);not null"                      json:"end_time"`
	WorkDays  StringSlice `gorm:"type:jsonb;not null;default:'[\"monday\",\"tuesday\",\"wednesday\",\"thursday\",\"friday\"]'" json:"work_days"`
	IsActive  bool        `gorm:"default:true"                                   json:"is_active"`
	CreatedAt time.Time   `gorm:"type:timestamptz;default:current_timestamp"     json:"created_at"`
	UpdatedAt time.Time   `gorm:"type:timestamptz;default:current_timestamp"     json:"updated_at"`
}
