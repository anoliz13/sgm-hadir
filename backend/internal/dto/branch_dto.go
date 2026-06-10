package dto

import "github.com/google/uuid"

type CreateBranchRequest struct {
	Name                 string   `json:"name" binding:"required"`
	Address              string   `json:"address"`
	Latitude             float64  `json:"latitude" binding:"required"`
	Longitude            float64  `json:"longitude" binding:"required"`
	RadiusMeters         int      `json:"radius_meters"`
	WorkStart            string   `json:"work_start" binding:"required"`
	WorkEnd              string   `json:"work_end" binding:"required"`
	LateToleranceMinutes int      `json:"late_tolerance_minutes"`
	WorkDays             []string `json:"work_days"`
	RequireSelfie        bool     `json:"require_selfie"`
	Timezone             string   `json:"timezone"`
}

type UpdateBranchRequest struct {
	Name                 *string   `json:"name"`
	Address              *string   `json:"address"`
	Latitude             *float64  `json:"latitude"`
	Longitude            *float64  `json:"longitude"`
	RadiusMeters         *int      `json:"radius_meters"`
	WorkStart            *string   `json:"work_start"`
	WorkEnd              *string   `json:"work_end"`
	LateToleranceMinutes *int      `json:"late_tolerance_minutes"`
	WorkDays             []string  `json:"work_days"`
	RequireSelfie        *bool     `json:"require_selfie"`
	Timezone             *string   `json:"timezone"`
	IsActive             *bool     `json:"is_active"`
}

type BranchResponse struct {
	ID                   uuid.UUID `json:"id"`
	Name                 string    `json:"name"`
	Address              *string   `json:"address"`
	Latitude             float64   `json:"latitude"`
	Longitude            float64   `json:"longitude"`
	RadiusMeters         int       `json:"radius_meters"`
	WorkStart            string    `json:"work_start"`
	WorkEnd              string    `json:"work_end"`
	LateToleranceMinutes int       `json:"late_tolerance_minutes"`
	WorkDays             []string  `json:"work_days"`
	RequireSelfie        bool      `json:"require_selfie"`
	Timezone             string    `json:"timezone"`
	IsActive             bool      `json:"is_active"`
}
