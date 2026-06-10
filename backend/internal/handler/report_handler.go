package handler

import (
	"bytes"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/sgm/hadir-backend/internal/dto"
	"github.com/sgm/hadir-backend/internal/middleware"
	"github.com/sgm/hadir-backend/internal/service"
)

type ReportHandler struct {
	service *service.ReportService
}

func NewReportHandler(service *service.ReportService) *ReportHandler {
	return &ReportHandler{service: service}
}

func (h *ReportHandler) applyBranchFilter(c *gin.Context, filter *dto.ReportFilter) {
	if middleware.IsBranchManager(c) && !middleware.IsSuperAdmin(c) {
		if branchID, exists := c.Get("branch_id"); exists {
			filter.BranchID = branchID.(uuid.UUID).String()
		}
	}
}

func (h *ReportHandler) GetAttendanceSummary(c *gin.Context) {
	var filter dto.ReportFilter
	if err := c.ShouldBindQuery(&filter); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}
	if err := filter.ParseDates(); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Format tanggal tidak valid, gunakan YYYY-MM-DD"})
		return
	}
	h.applyBranchFilter(c, &filter)

	data, err := h.service.GetAttendanceSummary(filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to generate report"})
		return
	}
	if data == nil {
		data = []dto.AttendanceSummary{}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Report generated successfully",
		"data":    data,
	})
}

func (h *ReportHandler) ExportExcel(c *gin.Context) {
	var filter dto.ReportFilter
	if err := c.ShouldBindQuery(&filter); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}
	if err := filter.ParseDates(); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Format tanggal tidak valid, gunakan YYYY-MM-DD"})
		return
	}
	h.applyBranchFilter(c, &filter)

	f, fileName, err := h.service.GenerateExcelReport(filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to export Excel"})
		return
	}

	c.Header("Content-Disposition", "attachment; filename="+fileName)

	var b bytes.Buffer
	if err := f.Write(&b); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to write Excel file"})
		return
	}

	c.Data(http.StatusOK, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", b.Bytes())
}

// parseDateRange is a shared helper for leave/overtime report endpoints
func parseDateRange(c *gin.Context) (time.Time, time.Time, string, error) {
	startStr := c.Query("start_date")
	endStr := c.Query("end_date")
	branchID := c.Query("branch_id")

	start, err := time.ParseInLocation("2006-01-02", startStr, time.Local)
	if err != nil {
		return time.Time{}, time.Time{}, "", err
	}
	end, err := time.ParseInLocation("2006-01-02", endStr, time.Local)
	if err != nil {
		return time.Time{}, time.Time{}, "", err
	}
	return start, end, branchID, nil
}

func (h *ReportHandler) GetLeaveReport(c *gin.Context) {
	start, end, branchID, err := parseDateRange(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Format tanggal tidak valid"})
		return
	}
	if middleware.IsBranchManager(c) && !middleware.IsSuperAdmin(c) {
		if bid, exists := c.Get("branch_id"); exists {
			branchID = bid.(uuid.UUID).String()
		}
	}

	data, err := h.service.GetLeaveReport(start, end, branchID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}
	if data == nil {
		data = []dto.LeaveReportRow{}
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": data})
}

func (h *ReportHandler) GetOvertimeReport(c *gin.Context) {
	start, end, branchID, err := parseDateRange(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Format tanggal tidak valid"})
		return
	}
	if middleware.IsBranchManager(c) && !middleware.IsSuperAdmin(c) {
		if bid, exists := c.Get("branch_id"); exists {
			branchID = bid.(uuid.UUID).String()
		}
	}

	data, err := h.service.GetOvertimeReport(start, end, branchID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}
	if data == nil {
		data = []dto.OvertimeReportRow{}
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": data})
}
