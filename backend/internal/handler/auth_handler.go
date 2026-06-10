package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/sgm/hadir-backend/internal/dto"
	"github.com/sgm/hadir-backend/internal/service"
)

type AuthHandler struct {
	authService *service.AuthService
}

func NewAuthHandler(authService *service.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

// Login godoc
func (h *AuthHandler) Login(c *gin.Context) {
	var req dto.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid request payload"})
		return
	}

	res, err := h.authService.Login(&req)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Login successful",
		"data":    res,
	})
}

// Logout godoc
func (h *AuthHandler) Logout(c *gin.Context) {
	// user_id is injected by auth_middleware
	userIDVal, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Unauthorized"})
		return
	}

	userID, ok := userIDVal.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Invalid user ID"})
		return
	}

	err := h.authService.Logout(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to logout"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Logout successful",
	})
}

func (h *AuthHandler) UpdateFCMToken(c *gin.Context) {
	userIDVal, _ := c.Get("user_id")
	userID := userIDVal.(uuid.UUID)

	var body struct {
		FCMToken string `json:"fcm_token" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "fcm_token is required"})
		return
	}

	if err := h.authService.UpdateFCMToken(userID, body.FCMToken); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to update FCM token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "FCM token updated"})
}

func (h *AuthHandler) GetProfile(c *gin.Context) {
	userIDVal, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Unauthorized"})
		return
	}

	userID := userIDVal.(uuid.UUID)

	user, err := h.authService.GetProfile(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "User not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Profile fetched successfully",
		"data": map[string]interface{}{
			"id":        user.ID,
			"nik":       user.NIK,
			"name":      user.Name,
			"email":     user.Email,
			"role":      user.Role,
			"position":  user.Position,
			"phone":     user.Phone,
			"photo_url": user.PhotoURL,
			"branch":    user.Branch,
		},
	})
}

func (h *AuthHandler) UpdateProfile(c *gin.Context) {
	userIDVal, _ := c.Get("user_id")
	userID := userIDVal.(uuid.UUID)

	var req struct {
		Name     string `json:"name"`
		Phone    string `json:"phone"`
		PhotoURL string `json:"photo_url"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid request"})
		return
	}

	if err := h.authService.UpdateProfile(userID, req.Name, req.Phone, req.PhotoURL); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Profil berhasil diperbarui"})
}

func (h *AuthHandler) RequestPasswordChange(c *gin.Context) {
	userIDVal, _ := c.Get("user_id")
	userID := userIDVal.(uuid.UUID)

	var req struct {
		CurrentPassword string `json:"current_password" binding:"required"`
		NewPassword     string `json:"new_password" binding:"required,min=6"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Password baru minimal 6 karakter"})
		return
	}

	if err := h.authService.ChangePassword(userID, req.CurrentPassword, req.NewPassword); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Password berhasil diubah"})
}
