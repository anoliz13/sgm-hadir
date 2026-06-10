package model

import (
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"
)

type Branch struct {
	ID                   uuid.UUID      `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	Name                 string         `gorm:"type:varchar(255);not null" json:"name"`
	Address              *string        `gorm:"type:text" json:"address"`
	Latitude             float64        `gorm:"type:double precision;not null" json:"latitude"`
	Longitude            float64        `gorm:"type:double precision;not null" json:"longitude"`
	RadiusMeters         int            `gorm:"default:100" json:"radius_meters"`
	WorkStart            string         `gorm:"type:time;not null" json:"work_start"` // e.g. 08:00:00
	WorkEnd              string         `gorm:"type:time;not null" json:"work_end"`   // e.g. 17:00:00
	LateToleranceMinutes int            `gorm:"default:15" json:"late_tolerance_minutes"`
	WorkDays             pq.StringArray `gorm:"type:varchar[];default:'{Mon,Tue,Wed,Thu,Fri}'" json:"work_days"`
	RequireSelfie        bool           `gorm:"default:false" json:"require_selfie"`
	Timezone             string         `gorm:"type:varchar(50);default:'Asia/Jakarta'" json:"timezone"`
	IsActive             bool           `gorm:"default:true" json:"is_active"`
	CreatedAt            time.Time      `gorm:"type:timestamptz;default:current_timestamp" json:"created_at"`
	UpdatedAt            time.Time      `gorm:"type:timestamptz;default:current_timestamp" json:"updated_at"`
}
