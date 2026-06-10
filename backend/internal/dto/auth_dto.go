package dto

import "github.com/google/uuid"

type LoginRequest struct {
	Identifier string `json:"identifier" binding:"required"` // NIK or Email
	Password   string `json:"password" binding:"required"`
}

type LoginResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	User         UserResponse `json:"user"`
}

type UserResponse struct {
	ID       uuid.UUID `json:"id"`
	NIK      string    `json:"nik"`
	Name     string    `json:"name"`
	Role     string    `json:"role"`
	PhotoURL *string   `json:"photo_url,omitempty"`
}

type RefreshRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}
