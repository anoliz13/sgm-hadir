package model

import "time"

// AppSetting stores application-wide key-value configuration.
type AppSetting struct {
	Key       string    `gorm:"type:varchar(100);primaryKey" json:"key"`
	Value     string    `gorm:"type:text"                    json:"value"`
	Label     string    `gorm:"type:varchar(200)"            json:"label"`
	Group     string    `gorm:"type:varchar(50);index"       json:"group"`
	UpdatedAt time.Time `json:"updated_at"`
}
