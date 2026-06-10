package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/sgm/hadir-backend/internal/dto"
	"github.com/sgm/hadir-backend/internal/middleware"
	"github.com/sgm/hadir-backend/internal/service"
)

type LeaveHandler struct {
	service *service.LeaveService
}

func NewLeaveHandler(service *service.LeaveService) *LeaveHandler {
	return &LeaveHandler{service: service}
}

func (h *LeaveHandler) CreateRequest(c *gin.Context) {
	userIDVal, _ := c.Get("user_id")
	userID := userIDVal.(uuid.UUID)

	var req dto.LeaveRequestCreate
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	leave, err := h.service.CreateLeaveRequest(userID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Leave request created successfully",
		"data":    leave,
	})
}

func (h *LeaveHandler) GetMyRequests(c *gin.Context) {
	userIDVal, _ := c.Get("user_id")
	userID := userIDVal.(uuid.UUID)

	var filter dto.LeaveFilter
	if err := c.ShouldBindQuery(&filter); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}
	filter.UserID = userID.String()

	leaves, err := h.service.GetAllLeaveRequests(filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to fetch leave requests"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Leave requests fetched successfully",
		"data":    leaves,
	})
}

func (h *LeaveHandler) GetAllRequests(c *gin.Context) {
	var filter dto.LeaveFilter
	if err := c.ShouldBindQuery(&filter); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	// Branch managers can only see requests from their own branch
	if middleware.IsBranchManager(c) && !middleware.IsSuperAdmin(c) {
		if branchID, exists := c.Get("branch_id"); exists {
			filter.BranchID = branchID.(uuid.UUID).String()
		}
	}

	leaves, err := h.service.GetAllLeaveRequests(filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to fetch leave requests"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Leave requests fetched successfully",
		"data":    leaves,
	})
}

func (h *LeaveHandler) UpdateStatus(c *gin.Context) {
	approverIDVal, _ := c.Get("user_id")
	approverID := approverIDVal.(uuid.UUID)

	idParam := c.Param("id")
	leaveID, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid leave ID"})
		return
	}

	var req dto.LeaveRequestUpdateStatus
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	if err := h.service.UpdateLeaveStatus(leaveID, approverID, req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Leave request status updated successfully",
	})
}

func (h *LeaveHandler) UpdateRequest(c *gin.Context) {
	userIDVal, _ := c.Get("user_id")
	userID := userIDVal.(uuid.UUID)

	idParam := c.Param("id")
	leaveID, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "ID pengajuan tidak valid"})
		return
	}

	var req dto.LeaveRequestCreate
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	if err := h.service.UpdateLeaveRequest(leaveID, userID, req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Pengajuan berhasil diperbarui",
	})
}

func (h *LeaveHandler) GetMyQuota(c *gin.Context) {
	userIDVal, _ := c.Get("user_id")
	userID := userIDVal.(uuid.UUID)

	quota, err := h.service.GetMyLeaveQuota(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": quota})
}

func (h *LeaveHandler) GetTypes(c *gin.Context) {
	types, err := h.service.GetAllLeaveTypes()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to fetch leave types"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    types,
	})
}
