package handler

import (
	"fmt"
	"net/http"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
)

type UploadHandler struct{}

func NewUploadHandler() *UploadHandler {
	return &UploadHandler{}
}

func (h *UploadHandler) UploadFile(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Failed to upload file"})
		return
	}

	// Create uploads directory if it doesn't exist
	// We'll just save it to a local folder named "uploads"
	filename := fmt.Sprintf("%d_%s", time.Now().Unix(), filepath.Base(file.Filename))
	savePath := filepath.Join("uploads", filename)

	if err := c.SaveUploadedFile(file, savePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to save file"})
		return
	}

	// Return the relative URL (can be accessed via static file server)
	fileUrl := fmt.Sprintf("/uploads/%s", filename)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "File uploaded successfully",
		"data": map[string]string{
			"url": fileUrl,
		},
	})
}
