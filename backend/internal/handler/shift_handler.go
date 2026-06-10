package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/sgm/hadir-backend/internal/service"
)

type ShiftHandler struct {
	svc *service.ShiftService
}

func NewShiftHandler(svc *service.ShiftService) *ShiftHandler {
	return &ShiftHandler{svc: svc}
}

func (h *ShiftHandler) GetAll(c *gin.Context) {
	shifts, err := h.svc.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": shifts})
}

func (h *ShiftHandler) Create(c *gin.Context) {
	var body struct {
		Name      string   `json:"name" binding:"required"`
		StartTime string   `json:"start_time" binding:"required"`
		EndTime   string   `json:"end_time" binding:"required"`
		WorkDays  []string `json:"work_days"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}
	shift, err := h.svc.Create(body.Name, body.StartTime, body.EndTime, body.WorkDays)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"success": true, "data": shift})
}

func (h *ShiftHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "invalid shift id"})
		return
	}
	var body struct {
		Name      string   `json:"name"`
		StartTime string   `json:"start_time"`
		EndTime   string   `json:"end_time"`
		IsActive  bool     `json:"is_active"`
		WorkDays  []string `json:"work_days"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}
	shift, err := h.svc.Update(id, body.Name, body.StartTime, body.EndTime, body.IsActive, body.WorkDays)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": shift})
}

func (h *ShiftHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "invalid shift id"})
		return
	}
	if err := h.svc.Delete(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Shift deleted"})
}

func (h *ShiftHandler) AssignShift(c *gin.Context) {
	employeeID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "invalid employee id"})
		return
	}
	var body struct {
		ShiftID       string `json:"shift_id" binding:"required"`
		EffectiveDate string `json:"effective_date" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}
	shiftID, err := uuid.Parse(body.ShiftID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "invalid shift_id"})
		return
	}
	if err := h.svc.AssignShift(employeeID, shiftID, body.EffectiveDate); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Shift assigned successfully"})
}

func (h *ShiftHandler) GetEmployeeShift(c *gin.Context) {
	employeeID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "invalid employee id"})
		return
	}
	shift, err := h.svc.GetActiveShift(employeeID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "No shift assigned"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": shift})
}

// GetMyShift returns the active shift for the currently logged-in user.
func (h *ShiftHandler) GetMyShift(c *gin.Context) {
	userIDVal, _ := c.Get("user_id")
	userID := userIDVal.(uuid.UUID)

	shift, err := h.svc.GetActiveShift(userID)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"success": true, "data": nil, "message": "No shift assigned"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": shift})
}
