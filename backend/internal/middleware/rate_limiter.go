package middleware

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	redis_client "github.com/sgm/hadir-backend/pkg/redis"
)

// RateLimiter limits requests for a specific action per user.
// Uses a simple sliding window or fixed window counter in Redis.
func RateLimiter(action string, limit int, window time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		userIDVal, exists := c.Get("user_id")
		if !exists {
			c.Next()
			return
		}

		userID := userIDVal.(uuid.UUID).String()
		key := fmt.Sprintf("ratelimit:%s:%s", action, userID)

		ctx := redis_client.Ctx
		client := redis_client.Client

		count, err := client.Get(ctx, key).Int()
		if err != nil && err.Error() != "redis: nil" {
			// Ignore redis error and let it pass, or return 500
			c.Next()
			return
		}

		if count >= limit {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"success": false,
				"message": "Too many requests, please try again later",
			})
			return
		}

		pipe := client.TxPipeline()
		pipe.Incr(ctx, key)
		if count == 0 {
			pipe.Expire(ctx, key, window)
		}
		_, _ = pipe.Exec(ctx)

		c.Next()
	}
}
