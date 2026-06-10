package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/sgm/hadir-backend/internal/middleware"
	"github.com/sgm/hadir-backend/internal/service"
)

type DashboardHandler struct {
	svc *service.DashboardService
}

func NewDashboardHandler(svc *service.DashboardService) *DashboardHandler {
	return &DashboardHandler{svc: svc}
}

func (h *DashboardHandler) GetSummary(c *gin.Context) {
	var branchID *uuid.UUID
	if middleware.IsBranchManager(c) && !middleware.IsSuperAdmin(c) {
		if bid, exists := c.Get("branch_id"); exists {
			id := bid.(uuid.UUID)
			branchID = &id
		}
	} else if q := c.Query("branch_id"); q != "" {
		id, err := uuid.Parse(q)
		if err == nil {
			branchID = &id
		}
	}

	data, err := h.svc.GetSummary(branchID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": data})
}

func (h *DashboardHandler) GetAttendanceTrend(c *gin.Context) {
	days := 30
	if d := c.Query("days"); d != "" {
		if v, err := strconv.Atoi(d); err == nil && v > 0 && v <= 365 {
			days = v
		}
	}

	var branchID *uuid.UUID
	if middleware.IsBranchManager(c) && !middleware.IsSuperAdmin(c) {
		if bid, exists := c.Get("branch_id"); exists {
			id := bid.(uuid.UUID)
			branchID = &id
		}
	} else if q := c.Query("branch_id"); q != "" {
		id, err := uuid.Parse(q)
		if err == nil {
			branchID = &id
		}
	}

	data, err := h.svc.GetAttendanceTrend(days, branchID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": data})
}

func (h *DashboardHandler) GetBranchComparison(c *gin.Context) {
	data, err := h.svc.GetBranchComparison()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": data})
}
