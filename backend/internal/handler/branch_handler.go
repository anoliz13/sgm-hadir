package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/sgm/hadir-backend/internal/dto"
	"github.com/sgm/hadir-backend/internal/service"
)

type BranchHandler struct {
	service *service.BranchService
}

func NewBranchHandler(service *service.BranchService) *BranchHandler {
	return &BranchHandler{service: service}
}

func (h *BranchHandler) Create(c *gin.Context) {
	var req dto.CreateBranchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	branch, err := h.service.CreateBranch(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to create branch"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Branch created successfully",
		"data":    branch,
	})
}

func (h *BranchHandler) GetAll(c *gin.Context) {
	branches, err := h.service.GetAllBranches()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to fetch branches"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Branches retrieved successfully",
		"data":    branches,
	})
}

func (h *BranchHandler) GetByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid branch ID"})
		return
	}

	branch, err := h.service.GetBranchByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "Branch not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Branch retrieved successfully",
		"data":    branch,
	})
}

func (h *BranchHandler) Update(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid branch ID"})
		return
	}

	var req dto.UpdateBranchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	branch, err := h.service.UpdateBranch(id, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Branch updated successfully",
		"data":    branch,
	})
}

func (h *BranchHandler) Delete(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid branch ID"})
		return
	}

	err = h.service.DeleteBranch(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to delete branch"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Branch deleted successfully",
	})
}
