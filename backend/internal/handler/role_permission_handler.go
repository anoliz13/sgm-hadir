package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sgm/hadir-backend/internal/service"
)

type RolePermissionHandler struct {
	svc *service.RolePermissionService
}

func NewRolePermissionHandler(svc *service.RolePermissionService) *RolePermissionHandler {
	return &RolePermissionHandler{svc: svc}
}

func (h *RolePermissionHandler) GetAll(c *gin.Context) {
	list, err := h.svc.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": list})
}

func (h *RolePermissionHandler) GetByRole(c *gin.Context) {
	role := c.Param("role")
	rp, err := h.svc.GetByRole(role)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "Role not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": rp})
}

func (h *RolePermissionHandler) Update(c *gin.Context) {
	role := c.Param("role")

	var body struct {
		DisplayName string   `json:"display_name"`
		Permissions []string `json:"permissions" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	rp, err := h.svc.Update(role, body.DisplayName, body.Permissions)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": rp, "message": "Permission updated"})
}
