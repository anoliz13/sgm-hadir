package main

import (
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/joho/godotenv"

	"github.com/sgm/hadir-backend/internal/handler"
	"github.com/sgm/hadir-backend/internal/middleware"
	"github.com/sgm/hadir-backend/internal/model"
	"github.com/sgm/hadir-backend/internal/repository"
	"github.com/sgm/hadir-backend/internal/service"
	"github.com/sgm/hadir-backend/pkg/fcm"
	"github.com/sgm/hadir-backend/pkg/postgres"
	redis_client "github.com/sgm/hadir-backend/pkg/redis"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for WebSocket in this demo
	},
}

func main() {
	// Load .env file if exists
	_ = godotenv.Load()

	// Initialize dependencies
	postgres.InitDB()
	redis_client.InitRedis()
	fcm.Init()

	// Create uploads directory
	os.MkdirAll("uploads", os.ModePerm)

	db := postgres.GetDB()

	// Ensure new roles exist in Postgres ENUM before AutoMigrate
	log.Println("Ensuring new user roles exist...")
	db.Exec("ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'kepala_salut'")
	db.Exec("ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'manajer_salut'")
	db.Exec("ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'employee'")

	// Migrate legacy role values to new lowercase naming
	db.Exec("UPDATE users SET role = 'super_admin' WHERE role IN ('SUPER_ADMIN')")
	db.Exec("UPDATE users SET role = 'supervisor' WHERE role IN ('SUPERVISOR')")
	db.Exec("UPDATE users SET role = 'employee' WHERE role IN ('KARYAWAN', 'karyawan', 'EMPLOYEE')")

	// AutoMigrate Database Models
	log.Println("Running AutoMigrate...")
	err := db.AutoMigrate(
		&model.User{},
		&model.Branch{},
		&model.Attendance{},
		&model.LeaveType{},
		&model.LeaveRequest{},
		&model.OvertimeRequest{},
		&model.Holiday{},
		&model.TempAssignment{},
		&model.ApprovalLog{},
		&model.Shift{},
		&model.EmployeeShift{},
		&model.RolePermission{},
		&model.AppSetting{},
	)
	if err != nil {
		log.Fatalf("Failed to auto-migrate database: %v", err)
	}

	// Repositories
	userRepo := repository.NewUserRepository(db)
	branchRepo := repository.NewBranchRepository(db)
	attendanceRepo := repository.NewAttendanceRepository(db)
	reportRepo := repository.NewReportRepository(db)
	leaveRepo := repository.NewLeaveRepository(db)
	holidayRepo := repository.NewHolidayRepository(db)
	shiftRepo := repository.NewShiftRepository(db)
	rolePermRepo := repository.NewRolePermissionRepository(db)
	settingRepo := repository.NewSettingRepository(db)

	// Seed defaults
	if err := rolePermRepo.SeedDefaults(); err != nil {
		log.Printf("Warning: seed role permissions failed: %v", err)
	}
	if err := settingRepo.SeedDefaults(); err != nil {
		log.Printf("Warning: seed settings failed: %v", err)
	}

	// Services
	authService := service.NewAuthService(db)
	employeeService := service.NewEmployeeService(userRepo)
	branchService := service.NewBranchService(branchRepo)
	attendanceService := service.NewAttendanceService(attendanceRepo, userRepo, branchRepo).WithShiftRepo(shiftRepo).WithDB(db)
	reportService := service.NewReportService(reportRepo)
	leaveService := service.NewLeaveService(leaveRepo, userRepo).WithDB(db)
	overtimeService := service.NewOvertimeService(db)
	notificationService := service.NewNotificationService(db)
	holidayService := service.NewHolidayService(holidayRepo)
	shiftService := service.NewShiftService(shiftRepo)
	dashboardService := service.NewDashboardService(db)
	rolePermService := service.NewRolePermissionService(rolePermRepo)
	settingService := service.NewSettingService(settingRepo)

	// Handlers
	authHandler := handler.NewAuthHandler(authService)
	employeeHandler := handler.NewEmployeeHandler(employeeService)
	branchHandler := handler.NewBranchHandler(branchService)
	attendanceHandler := handler.NewAttendanceHandler(attendanceService)
	reportHandler := handler.NewReportHandler(reportService)
	leaveHandler := handler.NewLeaveHandler(leaveService)
	overtimeHandler := handler.NewOvertimeHandler(overtimeService)
	uploadHandler := handler.NewUploadHandler()
	holidayHandler := handler.NewHolidayHandler(holidayService)
	shiftHandler := handler.NewShiftHandler(shiftService)
	dashboardHandler := handler.NewDashboardHandler(dashboardService)
	rolePermHandler := handler.NewRolePermissionHandler(rolePermService)
	settingHandler := handler.NewSettingHandler(settingService)

	// Start background notification scheduler
	go startNotificationScheduler(notificationService)

	// Setup Gin Router
	if os.Getenv("GIN_MODE") == "release" {
		gin.SetMode(gin.ReleaseMode)
	}
	r := gin.Default()

	// Serve static files for uploads
	r.Static("/uploads", "./uploads")

	// CORS Setup
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"}, // Adjust in production
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// WebSocket Endpoint for Real-time Dashboard
	r.GET("/ws/dashboard", func(c *gin.Context) {
		ws, err := upgrader.Upgrade(c.Writer, c.Request, nil)
		if err != nil {
			log.Println("WebSocket upgrade failed:", err)
			return
		}
		defer ws.Close()
		
		log.Println("Admin connected to real-time dashboard WebSocket")
		
		for {
			// Read messages (ping/pong or close)
			_, _, err := ws.ReadMessage()
			if err != nil {
				log.Println("WebSocket closed:", err)
				break
			}
		}
	})

	// API Routes
	api := r.Group("/api/v1")
	{
		// Public Auth Routes
		auth := api.Group("/auth")
		{
			auth.POST("/login", authHandler.Login)
		}

		// Protected Routes
		api.Use(middleware.AuthRequired())
		{
			// Auth Logout
			api.POST("/auth/logout", authHandler.Logout)

			// Employee (Self) Routes
			api.GET("/users/me", authHandler.GetProfile)
			api.PUT("/profile", authHandler.UpdateProfile)
			api.POST("/profile/change-password", authHandler.RequestPasswordChange)
			api.PUT("/profile/fcm-token", authHandler.UpdateFCMToken)
			api.GET("/my-shift", shiftHandler.GetMyShift)
			api.GET("/holidays", holidayHandler.GetAll)

			// Attendance Routes
			attendance := api.Group("/attendance")
			{
				attendance.POST("/check-in", middleware.RateLimiter("checkin", 5, 1), attendanceHandler.CheckIn)
				attendance.POST("/check-out", middleware.RateLimiter("checkout", 5, 1), attendanceHandler.CheckOut)
				attendance.GET("/today", attendanceHandler.GetToday)
				attendance.GET("/my-today", attendanceHandler.GetMyTodayStatus)
				attendance.GET("/my-history", attendanceHandler.GetMyHistory)
				attendance.GET("/dashboard", attendanceHandler.GetDashboardStats)
			}

			// Upload Route
			api.POST("/upload", uploadHandler.UploadFile)

			// Leave (Self) Routes
			leaves := api.Group("/leaves")
			{
				leaves.POST("", leaveHandler.CreateRequest)
				leaves.GET("", leaveHandler.GetMyRequests)
				leaves.GET("/types", leaveHandler.GetTypes)
				leaves.GET("/my-quota", leaveHandler.GetMyQuota)
				leaves.PUT("/:id", leaveHandler.UpdateRequest)
			}

			// Overtime (Self) Routes
			overtimes := api.Group("/overtimes")
			{
				overtimes.POST("", overtimeHandler.CreateRequest)
				overtimes.GET("", overtimeHandler.GetMyRequests)
				overtimes.PUT("/:id", overtimeHandler.UpdateRequest)
			}

			// Admin/Supervisor Routes (Master Data)
			admin := api.Group("/admin")
			admin.Use(middleware.RoleRequired(string(model.RoleSuperAdmin), string(model.RoleSupervisor)))
			{
				// Branch Management
				admin.POST("/branches", branchHandler.Create)
				admin.GET("/branches", branchHandler.GetAll)
				admin.GET("/branches/:id", branchHandler.GetByID)
				admin.PUT("/branches/:id", branchHandler.Update)
				admin.DELETE("/branches/:id", branchHandler.Delete)

				// Employee Management
				admin.POST("/employees", employeeHandler.Create)
				admin.GET("/employees", employeeHandler.GetAll)
				admin.GET("/employees/:id", employeeHandler.GetByID)
				admin.PUT("/employees/:id", employeeHandler.Update)

				// Attendance Management (Detail Logs)
				admin.GET("/attendances", attendanceHandler.GetAll)
				admin.GET("/attendances/export/excel", attendanceHandler.ExportExcel)
				admin.PUT("/attendances/:id", attendanceHandler.Update)

				// Reports
				admin.GET("/reports/attendance", reportHandler.GetAttendanceSummary)
				admin.GET("/reports/export/excel", reportHandler.ExportExcel)

				// Holiday Management
				admin.GET("/holidays", holidayHandler.GetAll)
				admin.POST("/holidays", holidayHandler.Create)
				admin.DELETE("/holidays/:id", holidayHandler.Delete)
				admin.POST("/holidays/import-national", holidayHandler.ImportNational)

				// Dashboard API
				admin.GET("/dashboard/summary", dashboardHandler.GetSummary)
				admin.GET("/dashboard/attendance-trend", dashboardHandler.GetAttendanceTrend)
				admin.GET("/dashboard/branch-comparison", dashboardHandler.GetBranchComparison)

				// Shift Management
				admin.GET("/shifts", shiftHandler.GetAll)
				admin.POST("/shifts", shiftHandler.Create)
				admin.PUT("/shifts/:id", shiftHandler.Update)
				admin.DELETE("/shifts/:id", shiftHandler.Delete)
				admin.POST("/employees/:id/shift", shiftHandler.AssignShift)
				admin.GET("/employees/:id/shift", shiftHandler.GetEmployeeShift)

				// Role & Permission Management (super_admin only enforced in handler layer)
				admin.GET("/role-permissions", rolePermHandler.GetAll)
				admin.GET("/role-permissions/:role", rolePermHandler.GetByRole)
				admin.PUT("/role-permissions/:role", rolePermHandler.Update)

				// App Settings
				admin.GET("/settings", settingHandler.GetAll)
				admin.GET("/settings/group/:group", settingHandler.GetByGroup)
				admin.PUT("/settings", settingHandler.BulkUpdate)

				// Additional report: Leave & Overtime summary
				admin.GET("/reports/leaves", reportHandler.GetLeaveReport)
				admin.GET("/reports/overtime", reportHandler.GetOvertimeReport)
			}

			// Approval Routes (Admin, Kepala Salut, Manajer Salut)
			approval := api.Group("/admin")
			approval.Use(middleware.RoleRequired(string(model.RoleSuperAdmin), string(model.RoleKepalaSalut), string(model.RoleManajerSalut)))
			{
				approval.GET("/leaves", leaveHandler.GetAllRequests)
				approval.PUT("/leaves/:id/status", leaveHandler.UpdateStatus)

				approval.GET("/overtimes", overtimeHandler.GetAllRequests)
				approval.PUT("/overtimes/:id/status", overtimeHandler.UpdateStatus)
			}
		}
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	
	log.Printf("Server running on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

// startNotificationScheduler runs cron jobs for FCM reminders.
func startNotificationScheduler(ns *service.NotificationService) {
	loc, err := time.LoadLocation("Asia/Jakarta")
	if err != nil {
		loc = time.UTC
		log.Println("[Scheduler] Using UTC timezone")
	}

	for {
		now := time.Now().In(loc)
		next := time.Date(now.Year(), now.Month(), now.Day(), now.Hour(), now.Minute()+1, 0, 0, loc)
		time.Sleep(time.Until(next))

		t := time.Now().In(loc)
		hour, minute := t.Hour(), t.Minute()

		if hour == 8 && minute == 0 {
			log.Println("[Scheduler] Sending check-in reminder")
			go ns.SendCheckInReminder()
		}
		if hour == 17 && minute == 0 {
			log.Println("[Scheduler] Sending check-out reminder")
			go ns.SendCheckOutReminder()
		}
		if hour == 18 && minute == 0 {
			log.Println("[Scheduler] Running auto check-out for pending employees")
			go ns.AutoCheckOutAll()
		}
	}
}
