package dto

import "github.com/google/uuid"
import "time"

type CheckInRequest struct {
	Latitude  float64 `json:"latitude" binding:"required"`
	Longitude float64 `json:"longitude" binding:"required"`
	SelfieURL string  `json:"selfie_url" binding:"required"`
	Type      string  `json:"type"`  // e.g. "check_in" or "visit_in"
	Notes     string  `json:"notes"` // For visit reason
}

type CheckOutRequest struct {
	Latitude  float64 `json:"latitude" binding:"required"`
	Longitude float64 `json:"longitude" binding:"required"`
	Type      string  `json:"type"`  // e.g. "check_out" or "visit_out"
	Notes     string  `json:"notes"` // For visit reason
}

type AttendanceResponse struct {
	ID                 uuid.UUID `json:"id"`
	Type               string    `json:"type"`
	Status             string    `json:"status"`
	DistanceFromBranch float64   `json:"distance_from_branch"`
	CreatedAt          string    `json:"created_at"`
}

type AttendanceFilter struct {
	StartDate string `form:"start_date"`
	EndDate   string `form:"end_date"`
	BranchID  string  `form:"branch_id"`
	Search    string  `form:"search"`
	Type      string  `form:"type"`
	UserID    *string `form:"user_id"`
}

type UpdateAttendanceRequest struct {
	Status        string  `json:"status" binding:"required"`
	Notes         *string `json:"notes"`
	IsManualEntry bool    `json:"is_manual_entry"`
	ManualReason  *string `json:"manual_reason"`
	CreatedAt     string  `json:"created_at"` // e.g. "2006-01-02T15:04:05Z"
}

type AttendanceLeaderboardEntry struct {
	UserID     uuid.UUID `json:"user_id"`
	Name       string    `json:"name"`
	OnTimeCount int      `json:"on_time_count"`
	LateCount  int      `json:"late_count"`
}

type AttendanceLogResponse struct {
	ID            uuid.UUID `json:"id"`
	UserNIK       string    `json:"user_nik"`
	UserName      string    `json:"user_name"`
	BranchName    string    `json:"branch_name"`
	Type          string    `json:"type"`
	Status        string    `json:"status"`
	CreatedAt     time.Time `json:"created_at"`
	Notes         *string   `json:"notes"`
	IsManualEntry bool      `json:"is_manual_entry"`
	ManualReason  *string   `json:"manual_reason"`
	Latitude      float64   `json:"latitude"`
	Longitude     float64   `json:"longitude"`
	SelfieURL     *string   `json:"selfie_url"`
}
