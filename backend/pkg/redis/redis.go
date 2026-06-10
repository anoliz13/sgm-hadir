package redis_client

import (
	"context"
	"log"
	"os"

	"github.com/redis/go-redis/v9"
)

var Client *redis.Client
var Ctx = context.Background()

// InitRedis initializes the Redis connection
func InitRedis() {
	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		log.Fatal("REDIS_URL environment variable is not set")
	}

	opt, err := redis.ParseURL(redisURL)
	if err != nil {
		log.Fatalf("Failed to parse REDIS_URL: %v", err)
	}

	Client = redis.NewClient(opt)

	// Ping to test connection
	_, err = Client.Ping(Ctx).Result()
	if err != nil {
		log.Fatalf("Failed to connect to Redis: %v", err)
	}

	log.Println("Successfully connected to Redis")
}

// GetClient returns the initialized Redis client
func GetClient() *redis.Client {
	return Client
}
