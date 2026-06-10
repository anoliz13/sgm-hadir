package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/sgm/hadir-backend/internal/dto"
	"github.com/sgm/hadir-backend/internal/service"
)

type EmployeeHandler struct {
	service *service.EmployeeService
}

func NewEmployeeHandler(service *service.EmployeeService) *EmployeeHandler {
	return &EmployeeHandler{service: service}
}

func (h *EmployeeHandler) Create(c *gin.Context) {
	var req dto.CreateEmployeeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	user, err := h.service.CreateEmployee(&req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Employee created successfully",
		"data": map[string]interface{}{
			"id":   user.ID,
			"nik":  user.NIK,
			"name": user.Name,
		},
	})
}

func (h *EmployeeHandler) GetAll(c *gin.Context) {
	users, err := h.service.GetAllEmployees()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to fetch employees"})
		return
	}

	var response []dto.EmployeeResponse
	for _, u := range users {
		res := dto.EmployeeResponse{
			ID:               u.ID,
			NIK:              u.NIK,
			Name:             u.Name,
			Email:            u.Email,
			Role:             string(u.Role),
			BranchID:         u.BranchID,
			Position:         u.Position,
			Division:         u.Division,
			Phone:            u.Phone,
			PhotoURL:         u.PhotoURL,
			AnnualLeaveQuota: u.AnnualLeaveQuota,
			AnnualLeaveUsed:  u.AnnualLeaveUsed,
			IsActive:         u.IsActive,
		}
		response = append(response, res)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Employees retrieved successfully",
		"data":    response,
	})
}

func (h *EmployeeHandler) GetByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid employee ID"})
		return
	}

	u, err := h.service.GetEmployeeByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "Employee not found"})
		return
	}

	res := dto.EmployeeResponse{
		ID:               u.ID,
		NIK:              u.NIK,
		Name:             u.Name,
		Email:            u.Email,
		Role:             string(u.Role),
		BranchID:         u.BranchID,
		Position:         u.Position,
		Division:         u.Division,
		Phone:            u.Phone,
		PhotoURL:         u.PhotoURL,
		AnnualLeaveQuota: u.AnnualLeaveQuota,
		AnnualLeaveUsed:  u.AnnualLeaveUsed,
		IsActive:         u.IsActive,
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Employee retrieved successfully",
		"data":    res,
	})
}

func (h *EmployeeHandler) Update(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid employee ID"})
		return
	}

	var req dto.UpdateEmployeeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	user, err := h.service.UpdateEmployee(id, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Employee updated successfully",
		"data": map[string]interface{}{
			"id":   user.ID,
			"name": user.Name,
		},
	})
}
