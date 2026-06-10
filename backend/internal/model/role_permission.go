package model

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
	"time"
)

// StringSlice is a JSON-serializable string slice for GORM
type StringSlice []string

func (s StringSlice) Value() (driver.Value, error) {
	b, err := json.Marshal(s)
	return string(b), err
}

func (s *StringSlice) Scan(value interface{}) error {
	var bytes []byte
	switch v := value.(type) {
	case string:
		bytes = []byte(v)
	case []byte:
		bytes = v
	default:
		return fmt.Errorf("cannot scan type %T into StringSlice", value)
	}
	return json.Unmarshal(bytes, s)
}

// RolePermission stores which permissions are granted to each role.
type RolePermission struct {
	ID          uint        `gorm:"primaryKey;autoIncrement"               json:"id"`
	RoleName    string      `gorm:"type:varchar(50);uniqueIndex;not null"  json:"role_name"`
	DisplayName string      `gorm:"type:varchar(100);not null"             json:"display_name"`
	Permissions StringSlice `gorm:"type:jsonb;not null;default:'[]'"       json:"permissions"`
	CreatedAt   time.Time   `json:"created_at"`
	UpdatedAt   time.Time   `json:"updated_at"`
}
