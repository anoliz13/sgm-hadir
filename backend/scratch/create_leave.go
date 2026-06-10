package main

import (
	"log"
	"time"

	"github.com/joho/godotenv"
	"github.com/sgm/hadir-backend/internal/model"
	"github.com/sgm/hadir-backend/pkg/postgres"
)

func main() {
	_ = godotenv.Load(".env") // Load from root
	postgres.InitDB()
	db := postgres.GetDB()

	var user model.User
	if err := db.First(&user).Error; err != nil {
		log.Fatalf("Failed to find user: %v", err)
	}

	var leaveType model.LeaveType
	if err := db.First(&leaveType).Error; err != nil {
		leaveType = model.LeaveType{
			Name:             "Cuti Tahunan",
			RequiresDocument: false,
			DeductsQuota:     true,
			MaxDaysPerYear:   func() *int { i := 12; return &i }(),
		}
		if err := db.Create(&leaveType).Error; err != nil {
			log.Fatalf("Failed to create leave type: %v", err)
		}
	}

	reason := "Keperluan keluarga"
	req := model.LeaveRequest{
		UserID:      user.ID,
		LeaveTypeID: leaveType.ID,
		StartDate:   time.Now().Add(24 * time.Hour),
		EndDate:     time.Now().Add(3 * 24 * time.Hour),
		TotalDays:   3,
		Reason:      &reason,
		Status:      model.LeaveStatusPending,
	}

	if err := db.Create(&req).Error; err != nil {
		log.Fatalf("Failed to create leave request: %v", err)
	}

	log.Printf("Successfully created leave request: %v", req.ID)
}
