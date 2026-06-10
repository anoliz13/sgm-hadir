package handler

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sgm/hadir-backend/internal/model"
	"github.com/sgm/hadir-backend/internal/service"
)

type HolidayHandler struct {
	svc *service.HolidayService
}

func NewHolidayHandler(svc *service.HolidayService) *HolidayHandler {
	return &HolidayHandler{svc: svc}
}

func (h *HolidayHandler) GetAll(c *gin.Context) {
	holidays, err := h.svc.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": holidays})
}

func (h *HolidayHandler) Create(c *gin.Context) {
	var body struct {
		Name string `json:"name" binding:"required"`
		Date string `json:"date" binding:"required"`
		Type string `json:"type"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	date, err := time.Parse("2006-01-02", body.Date)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "invalid date format, use YYYY-MM-DD"})
		return
	}

	hType := model.HolidayTypeNational
	if body.Type == "company" {
		hType = model.HolidayTypeCompany
	}

	holiday, err := h.svc.Create(body.Name, date, hType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"success": true, "data": holiday})
}

func (h *HolidayHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	if err := h.svc.Delete(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Holiday deleted"})
}

func (h *HolidayHandler) ImportNational(c *gin.Context) {
	yearStr := c.Query("year")
	year := time.Now().Year()
	if yearStr != "" {
		if y, err := strconv.Atoi(yearStr); err == nil {
			year = y
		}
	}

	count, err := h.svc.ImportNationalHolidays(year)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "National holidays imported",
		"data":    gin.H{"year": year, "imported": count},
	})
}
