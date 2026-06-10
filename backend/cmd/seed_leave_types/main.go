package main

import (
	"log"

	"github.com/joho/godotenv"
	"github.com/sgm/hadir-backend/internal/model"
	"github.com/sgm/hadir-backend/pkg/postgres"
)

func main() {
	_ = godotenv.Load()
	postgres.InitDB()
	db := postgres.GetDB()

	leaveTypes := []model.LeaveType{
		{Name: "Cuti Tahunan", RequiresDocument: false, DeductsQuota: true},
		{Name: "Izin Sakit", RequiresDocument: true, DeductsQuota: false},
		{Name: "Izin dengan Keterangan", RequiresDocument: true, DeductsQuota: false},
	}

	for _, lt := range leaveTypes {
		var existing model.LeaveType
		if err := db.Where("name = ?", lt.Name).First(&existing).Error; err != nil {
			// Create
			db.Create(&lt)
			log.Printf("Created leave type: %s", lt.Name)
		} else {
			log.Printf("Leave type %s already exists", lt.Name)
		}
	}
}
