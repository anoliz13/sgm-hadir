package model

import (
	"time"

	"github.com/google/uuid"
)

type TempAssignment struct {
	ID        uuid.UUID  `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	UserID    uuid.UUID  `gorm:"type:uuid;not null"`
	User      *User      `gorm:"foreignKey:UserID"`
	BranchID  uuid.UUID  `gorm:"type:uuid;not null"`
	Branch    *Branch    `gorm:"foreignKey:BranchID"`
	StartDate time.Time  `gorm:"type:date;not null"`
	EndDate   time.Time  `gorm:"type:date;not null"`
	Reason    *string    `gorm:"type:text"`
	CreatedBy *uuid.UUID `gorm:"type:uuid"`
	Creator   *User      `gorm:"foreignKey:CreatedBy"`
	CreatedAt time.Time  `gorm:"type:timestamptz;default:current_timestamp"`
}

type ApprovalLog struct {
	ID         uuid.UUID  `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	EntityType string     `gorm:"type:varchar(50);not null"`
	EntityID   uuid.UUID  `gorm:"type:uuid;not null"`
	Action     string     `gorm:"type:varchar(50);not null"`
	ActorID    uuid.UUID  `gorm:"type:uuid;not null"`
	Actor      *User      `gorm:"foreignKey:ActorID"`
	OldStatus  *string    `gorm:"type:varchar(50)"`
	NewStatus  *string    `gorm:"type:varchar(50)"`
	Note       *string    `gorm:"type:text"`
	CreatedAt  time.Time  `gorm:"type:timestamptz;default:current_timestamp"`
}
