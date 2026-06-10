package main

import (
	"log"

	"github.com/joho/godotenv"
	"github.com/sgm/hadir-backend/internal/model"
	"github.com/sgm/hadir-backend/pkg/hash"
	"github.com/sgm/hadir-backend/pkg/postgres"
)

func main() {
	_ = godotenv.Load()
	postgres.InitDB()
	db := postgres.GetDB()

	// Reset password to 'admin123' for NIK admin@sgm.co.id
	hashed, _ := hash.HashPassword("admin123")
	result := db.Model(&model.User{}).Where("nik = ?", "admin@sgm.co.id").Update("password_hash", hashed)
	log.Printf("Updated %d admin passwords", result.RowsAffected)
}
