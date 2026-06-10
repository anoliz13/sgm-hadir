package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/sgm/hadir-backend/internal/dto"
	"github.com/sgm/hadir-backend/internal/service"
)

type OvertimeHandler struct {
	service *service.OvertimeService
}

func NewOvertimeHandler(service *service.OvertimeService) *OvertimeHandler {
	return &OvertimeHandler{service: service}
}

func (h *OvertimeHandler) CreateRequest(c *gin.Context) {
	userIDVal, _ := c.Get("user_id")
	userID := userIDVal.(uuid.UUID)

	var req dto.OvertimeRequestCreate
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	overtime, err := h.service.CreateRequest(userID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Overtime request created successfully",
		"data":    overtime,
	})
}

func (h *OvertimeHandler) GetMyRequests(c *gin.Context) {
	userIDVal, _ := c.Get("user_id")
	userID := userIDVal.(uuid.UUID)

	var filter dto.OvertimeFilter
	if err := c.ShouldBindQuery(&filter); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}
	filter.UserID = userID.String()

	overtimes, err := h.service.GetAllRequests(filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to fetch overtime requests"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Overtime requests fetched successfully",
		"data":    overtimes,
	})
}

func (h *OvertimeHandler) GetAllRequests(c *gin.Context) {
	var filter dto.OvertimeFilter
	if err := c.ShouldBindQuery(&filter); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	overtimes, err := h.service.GetAllRequests(filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to fetch overtime requests"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Overtime requests fetched successfully",
		"data":    overtimes,
	})
}

func (h *OvertimeHandler) UpdateRequest(c *gin.Context) {
	userIDVal, _ := c.Get("user_id")
	userID := userIDVal.(uuid.UUID)

	idParam := c.Param("id")
	overtimeID, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "ID pengajuan tidak valid"})
		return
	}

	var req dto.OvertimeRequestCreate
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	if err := h.service.UpdateOvertimeRequest(overtimeID, userID, req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Pengajuan lembur berhasil diperbarui",
	})
}

func (h *OvertimeHandler) UpdateStatus(c *gin.Context) {
	approverIDVal, _ := c.Get("user_id")
	approverID := approverIDVal.(uuid.UUID)

	idParam := c.Param("id")
	overtimeID, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid overtime ID"})
		return
	}

	var req dto.OvertimeRequestUpdateStatus
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	if err := h.service.UpdateStatus(overtimeID, approverID, req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Overtime request status updated successfully",
	})
}
