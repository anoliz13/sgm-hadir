package handler

import (
	"bytes"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/sgm/hadir-backend/internal/dto"
	"github.com/sgm/hadir-backend/internal/middleware"
	"github.com/sgm/hadir-backend/internal/service"
)

type AttendanceHandler struct {
	service *service.AttendanceService
}

func NewAttendanceHandler(service *service.AttendanceService) *AttendanceHandler {
	return &AttendanceHandler{service: service}
}

func (h *AttendanceHandler) CheckIn(c *gin.Context) {
	userIDVal, _ := c.Get("user_id")
	userID := userIDVal.(uuid.UUID)

	var req dto.CheckInRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	attendance, err := h.service.CheckIn(userID, &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Check-in berhasil",
		"data": map[string]interface{}{
			"id":     attendance.ID,
			"status": attendance.Status,
		},
	})
}

func (h *AttendanceHandler) CheckOut(c *gin.Context) {
	userIDVal, _ := c.Get("user_id")
	userID := userIDVal.(uuid.UUID)

	var req dto.CheckOutRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	attendance, err := h.service.CheckOut(userID, &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Check-out berhasil",
		"data": map[string]interface{}{
			"id":     attendance.ID,
			"status": attendance.Status,
		},
	})
}

func (h *AttendanceHandler) GetToday(c *gin.Context) {
	attendances, err := h.service.GetTodayAttendances()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to fetch today's attendance"})
		return
	}

	// Transform to a cleaner response
	var result []map[string]interface{}
	for _, a := range attendances {
		item := map[string]interface{}{
			"id":         a.ID,
			"type":       a.Type,
			"status":     a.Status,
			"latitude":   a.Latitude,
			"longitude":  a.Longitude,
			"selfie_url": a.SelfieURL,
			"timestamp":  a.CreatedAt,
		}
		if a.User != nil {
			item["user_name"] = a.User.Name
			item["user_nik"] = a.User.NIK
			item["user_position"] = a.User.Position
		}
		if a.DistanceFromBranch != nil {
			item["distance"] = *a.DistanceFromBranch
		}
		result = append(result, item)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Today's attendance",
		"data":    result,
	})
}

func (h *AttendanceHandler) GetMyTodayStatus(c *gin.Context) {
	userIDVal, _ := c.Get("user_id")
	userID := userIDVal.(uuid.UUID)

	checkIn, _ := h.service.GetMyTodayCheckIn(userID)
	checkOut, _ := h.service.GetMyTodayCheckOut(userID)
	visitIn, _ := h.service.GetMyTodayVisitIn(userID)
	visitOut, _ := h.service.GetMyTodayVisitOut(userID)

	// Kunjungan dianggap aktif jika visit_in ada tapi visit_out belum ada
	isVisitActive := visitIn != nil && visitOut == nil

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Status absensi hari ini",
		"data": map[string]interface{}{
			"is_checked_in":   checkIn != nil,
			"is_checked_out":  checkOut != nil,
			"check_in_time":   checkIn,
			"check_out_time":  checkOut,
			"is_visit_active": isVisitActive,
			"is_visit_in":     visitIn != nil,
			"is_visit_out":    visitOut != nil,
			"visit_in_time":   visitIn,
			"visit_out_time":  visitOut,
		},
	})
}

func (h *AttendanceHandler) GetAll(c *gin.Context) {
	var filter dto.AttendanceFilter
	if err := c.ShouldBindQuery(&filter); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	// Branch managers can only see their own branch's attendance
	if middleware.IsBranchManager(c) && !middleware.IsSuperAdmin(c) {
		if branchID, exists := c.Get("branch_id"); exists {
			filter.BranchID = branchID.(uuid.UUID).String()
		}
	}

	attendances, err := h.service.GetAllAttendances(filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to fetch attendances"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Attendances fetched successfully",
		"data":    attendances,
	})
}

func (h *AttendanceHandler) GetMyHistory(c *gin.Context) {
	userIDVal, _ := c.Get("user_id")
	userID := userIDVal.(uuid.UUID)

	var filter dto.AttendanceFilter
	if err := c.ShouldBindQuery(&filter); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	userIDStr := userID.String()
	filter.UserID = &userIDStr

	attendances, err := h.service.GetAllAttendances(filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to fetch attendances"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Riwayat absensi berhasil diambil",
		"data":    attendances,
	})
}

func (h *AttendanceHandler) GetDashboardStats(c *gin.Context) {
	userIDVal, _ := c.Get("user_id")
	userID := userIDVal.(uuid.UUID)

	stats, err := h.service.GetDashboardStats(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to fetch stats"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Dashboard stats fetched successfully",
		"data":    stats,
	})
}

func (h *AttendanceHandler) Update(c *gin.Context) {
	idParam := c.Param("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid ID format"})
		return
	}

	var req dto.UpdateAttendanceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	if err := h.service.UpdateAttendance(id, req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to update attendance: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Attendance updated successfully",
	})
}

func (h *AttendanceHandler) ExportExcel(c *gin.Context) {
	var filter dto.AttendanceFilter
	if err := c.ShouldBindQuery(&filter); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	attendances, err := h.service.GetAllAttendances(filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to fetch attendances"})
		return
	}

	f, fileName, err := h.service.GenerateExcelReport(attendances)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to export Excel: " + err.Error()})
		return
	}

	c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.Header("Content-Disposition", "attachment; filename="+fileName)
	
	var b bytes.Buffer
	if err := f.Write(&b); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to write Excel file"})
		return
	}

	c.Data(http.StatusOK, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", b.Bytes())
}
