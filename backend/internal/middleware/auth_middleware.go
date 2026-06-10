package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	jwt_utils "github.com/sgm/hadir-backend/pkg/jwt"
)

// AuthRequired is a middleware that checks for a valid access token in the Authorization header
func AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Authorization header is required"})
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Invalid Authorization header format"})
			return
		}

		tokenString := parts[1]
		claims, err := jwt_utils.ValidateToken(tokenString)
		if err != nil {
			msg := "Invalid token"
			if err == jwt_utils.ErrExpiredToken {
				msg = "Token has expired"
			}
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"success": false, "message": msg})
			return
		}

		if claims.Type != "access" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Invalid token type"})
			return
		}

		// Set user info to context
		c.Set("user_id", claims.UserID)
		c.Set("role", claims.Role)
		if claims.BranchID != nil {
			c.Set("branch_id", *claims.BranchID)
		}
		c.Next()
	}
}

// RoleRequired is a middleware that checks if the authenticated user has one of the required roles
func RoleRequired(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole, exists := c.Get("role")
		if !exists {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Unauthorized"})
			return
		}

		roleStr, ok := userRole.(string)
		if !ok {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Internal server error"})
			return
		}

		hasRole := false
		for _, r := range roles {
			if roleStr == r {
				hasRole = true
				break
			}
		}

		if !hasRole {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"success": false, "message": "Forbidden: insufficient permissions"})
			return
		}

		c.Next()
	}
}

// IsSuperAdmin returns true if the current user is super_admin
func IsSuperAdmin(c *gin.Context) bool {
	role, _ := c.Get("role")
	return role == "super_admin"
}

// IsBranchManager returns true if the user is a branch-scoped manager (kepala_salut or manajer_salut)
func IsBranchManager(c *gin.Context) bool {
	role, _ := c.Get("role")
	return role == "kepala_salut" || role == "manajer_salut"
}
